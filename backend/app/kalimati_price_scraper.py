"""
Kalimati Market Daily Price Scraper — FastAPI service
use:
    GET /scrape?lang=en        -> scrape the latest price list, save an Excel file
    GET /prices?lang=en        -> scrape the latest price list, JSON only
    GET /scrape-week?days=7    -> scrape the last N days (default 7), save ONE Excel file
    GET /prices-week?days=7    -> scrape the last N days, JSON only
    GET /files                 -> list previously saved Excel files
    GET /download/{name}       -> download a saved Excel file
    GET /download-latest       -> download the most recently saved Excel file
"""

import glob
import os
import re
import time
from datetime import datetime, timedelta
from typing import List, Optional

import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.responses import FileResponse
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from pydantic import BaseModel

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

BASE_URL = os.getenv("KALIMATI_BASE_URL", "https://kalimatimarket.gov.np")
PRICE_PATH = "/price"
TABLE_ID = "commodityPriceParticular"  # <table id="..."> in the site's own template

OUTPUT_DIR = os.getenv(
    "KALIMATI_OUTPUT_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "output"),
)
os.makedirs(OUTPUT_DIR, exist_ok=True)

REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9,ne;q=0.8",
}
REQUEST_TIMEOUT = 25  # seconds


# --------------------------------------------------------------------------
# Nepali (Devanagari) digit handling
# --------------------------------------------------------------------------
# In Nepali mode the site prints numbers as Devanagari digits, e.g. "रू ४८.३३".
# In English mode it's plain "Rs 48.33". This normalizes either into a float.

_NEPALI_DIGITS = "०१२३४५६७८९"
_DIGIT_TRANSLATION = str.maketrans(_NEPALI_DIGITS, "0123456789")


def _to_float(raw: str) -> Optional[float]:
    """
    Turn a price cell into a float, or None.
    Handles 'रू ४८.३३' (Devanagari digits), 'Rs 48.33', and thousands-grouped
    values like 'रू १,०००.००' / 'Rs 1,000.00' — the site's own PHP formatting
    (number_format) inserts comma separators above 1000, so those must be
    stripped before parsing or e.g. "1,000.00" would parse as just "1".
    """
    if not raw:
        return None
    normalized = raw.translate(_DIGIT_TRANSLATION).replace(",", "")
    match = re.search(r"\d+(\.\d+)?", normalized)
    return float(match.group()) if match else None


# --------------------------------------------------------------------------
# Data models
# --------------------------------------------------------------------------


class PriceItem(BaseModel):
    commodity: str
    unit: str
    min_price: Optional[float]
    max_price: Optional[float]
    avg_price: Optional[float]


class ScrapeResult(BaseModel):
    date: str
    date_label: Optional[str]
    lang: str
    scraped_at: str
    source_url: str
    count: int
    items: List[PriceItem]


# --------------------------------------------------------------------------
# HTML parsing helpers
# --------------------------------------------------------------------------


def _parse_price_table(html: str) -> List[dict]:
    """Extract rows from <table id="commodityPriceParticular">."""
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", id=TABLE_ID)

    if table is None:
        # Fallback in case the site's markup ever changes: look for any
        # table whose header mentions "Commodity" (EN) or "कृषि उपज" (NP).
        for candidate in soup.find_all("table"):
            head_text = candidate.get_text()
            if "Commodity" in head_text or "कृषि उपज" in head_text:
                table = candidate
                break

    if table is None:
        return []

    body = table.find("tbody") or table
    rows = []
    for tr in body.find_all("tr"):
        cells = [td.get_text(strip=True) for td in tr.find_all("td")]
        if len(cells) < 5:
            continue
        name, unit, min_p, max_p, avg_p = cells[:5]
        rows.append(
            {
                "commodity": name,
                "unit": unit,
                "min_price": _to_float(min_p),
                "max_price": _to_float(max_p),
                "avg_price": _to_float(avg_p),
            }
        )
    return rows


def _extract_csrf_token(html: str) -> Optional[str]:
    soup = BeautifulSoup(html, "html.parser")
    token_input = soup.find("input", id="csrf") or soup.find(
        "input", attrs={"name": "_token"}
    )
    return token_input.get("value") if token_input else None


def _extract_date_label(html: str) -> Optional[str]:
    soup = BeautifulSoup(html, "html.parser")
    heading = soup.find("h4", class_="bottom-head")
    return heading.get_text(strip=True) if heading else None


# --------------------------------------------------------------------------
# Scraping
# --------------------------------------------------------------------------


def _fetch_prices_for_date(session: requests.Session, date_str: Optional[str]):
    """
    date_str=None -> the site's own default (today's server date).
    date_str='YYYY-MM-DD' -> uses the site's date-picker POST endpoint
    (mirrors the "Check Prices" form on /price), which needs a CSRF token
    pulled from a fresh GET first.
    """
    if date_str is None:
        resp = session.get(
            f"{BASE_URL}{PRICE_PATH}", headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT
        )
        resp.raise_for_status()
        return _parse_price_table(resp.text), resp.text

    get_resp = session.get(
        f"{BASE_URL}{PRICE_PATH}", headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT
    )
    get_resp.raise_for_status()
    token = _extract_csrf_token(get_resp.text)
    if not token:
        raise RuntimeError(
            "Could not find a CSRF token on the price page; site markup may have changed."
        )

    post_resp = session.post(
        f"{BASE_URL}{PRICE_PATH}",
        headers=REQUEST_HEADERS,
        data={"_token": token, "datePricing": date_str},
        timeout=REQUEST_TIMEOUT,
    )
    post_resp.raise_for_status()
    return _parse_price_table(post_resp.text), post_resp.text


def scrape_kalimati_prices(lang: str = "en", max_lookback_days: int = 5) -> dict:
    """
    Scrape the most recent available daily wholesale price list.

    lang: 'en' or 'np' — which language the commodity/unit names and prices
          come back in (both live on the source site itself).
    max_lookback_days: how many days to step backwards looking for a
          populated list if today's hasn't been published yet.
    """
    if lang not in ("en", "np"):
        raise ValueError("lang must be 'en' or 'np'")

    session = requests.Session()
    # Setting the locale stores it against this session's cookie server-side;
    # the /price request right after will come back in that language.
    lang_resp = session.get(
        f"{BASE_URL}/lang/{lang}", headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT
    )
    lang_resp.raise_for_status()

    rows, html = _fetch_prices_for_date(session, None)
    used_date = datetime.now().date()

    attempts = 0
    while not rows and attempts < max_lookback_days:
        attempts += 1
        used_date -= timedelta(days=1)
        rows, html = _fetch_prices_for_date(session, used_date.strftime("%Y-%m-%d"))

    if not rows:
        raise RuntimeError(
            f"No price data found for today or the previous {max_lookback_days} day(s). "
            "The board may not have published yet, or the site may be down."
        )

    return {
        "date": used_date.isoformat(),
        "date_label": _extract_date_label(html),
        "lang": lang,
        "scraped_at": datetime.now().isoformat(timespec="seconds"),
        "source_url": f"{BASE_URL}{PRICE_PATH}",
        "count": len(rows),
        "items": rows,
    }


def scrape_kalimati_prices_range(lang: str = "en", days: int = 7) -> List[dict]:
    """
    Scrape one day's price list at a time for each of the last `days`
    calendar days (today plus the previous `days - 1` days) using the
    site's own date-picker POST endpoint, so you get a full week (or
    whatever range you ask for) in one call.

    Returned oldest-first, today last. Unlike scrape_kalimati_prices(),
    this does NOT substitute an older date when a given day comes back
    empty — every requested calendar date is reported on its own, with
    count=0 and an empty items list if the board had nothing published
    for it (e.g. a holiday), so the "date" on each entry always matches
    what it actually reflects.
    """
    if lang not in ("en", "np"):
        raise ValueError("lang must be 'en' or 'np'")
    if days < 1:
        raise ValueError("days must be at least 1")

    session = requests.Session()
    lang_resp = session.get(
        f"{BASE_URL}/lang/{lang}", headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT
    )
    lang_resp.raise_for_status()

    today = datetime.now().date()
    results = []

    for offset in range(days - 1, -1, -1):  # oldest first, today last
        target_date = today - timedelta(days=offset)
        is_today = offset == 0
        entry = {
            "date": target_date.isoformat(),
            "date_label": None,
            "lang": lang,
            "scraped_at": datetime.now().isoformat(timespec="seconds"),
            "source_url": f"{BASE_URL}{PRICE_PATH}",
            "count": 0,
            "items": [],
        }
        try:
            rows, html = _fetch_prices_for_date(
                session, None if is_today else target_date.strftime("%Y-%m-%d")
            )
            entry["date_label"] = _extract_date_label(html)
            entry["items"] = rows
            entry["count"] = len(rows)
        except requests.RequestException as e:
            entry["error"] = str(e)

        results.append(entry)

        if offset > 0:
            time.sleep(0.5)  # be polite to a small government server

    return results


# --------------------------------------------------------------------------
# Excel export
# --------------------------------------------------------------------------


def _write_price_sheet(ws, data: dict) -> None:
    """
    Write one day's formatted price report onto a worksheet. Shared by the
    single-day export and by each per-day tab in the weekly workbook below.
    """
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(
        start_color="2E7D32", end_color="2E7D32", fill_type="solid"
    )
    title_font = Font(bold=True, size=13, color="1B5E20")
    subtitle_font = Font(italic=True, size=9, color="616161")
    center = Alignment(horizontal="center", vertical="center")

    headers = [
        "S.N.",
        "Commodity",
        "Unit",
        "Min Price (Rs)",
        "Max Price (Rs)",
        "Avg Price (Rs)",
    ]

    ws.merge_cells("A1:F1")
    ws["A1"] = "Kalimati Fruits & Vegetables Market — Daily Wholesale Price List"
    ws["A1"].font = title_font
    ws["A1"].alignment = center

    ws.merge_cells("A2:F2")
    label = data.get("date_label") or data["date"]
    if data["items"]:
        subtitle = (
            f"Date: {label}    |    Scraped: {data['scraped_at']}    |    "
            f"Source: {data['source_url']}"
        )
    else:
        subtitle = f"Date: {label}    |    No data published for this date"
    ws["A2"] = subtitle
    ws["A2"].font = subtitle_font
    ws["A2"].alignment = center

    header_row = 4
    for col_idx, text in enumerate(headers, start=1):
        cell = ws.cell(row=header_row, column=col_idx, value=text)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center

    for i, item in enumerate(data["items"], start=1):
        r = header_row + i
        ws.cell(row=r, column=1, value=i)
        ws.cell(row=r, column=2, value=item["commodity"])
        ws.cell(row=r, column=3, value=item["unit"])
        ws.cell(row=r, column=4, value=item["min_price"]).number_format = "0.00"
        ws.cell(row=r, column=5, value=item["max_price"]).number_format = "0.00"
        ws.cell(row=r, column=6, value=item["avg_price"]).number_format = "0.00"

    for col_letter, width in zip("ABCDEF", (6, 34, 10, 16, 16, 16)):
        ws.column_dimensions[col_letter].width = width

    last_row = header_row + len(data["items"])
    if data["items"]:
        ws.auto_filter.ref = f"A{header_row}:F{last_row}"
    ws.freeze_panes = f"A{header_row + 1}"


def save_to_excel(data: dict, filepath: str) -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = "Kalimati Prices"
    _write_price_sheet(ws, data)
    wb.save(filepath)


def save_range_to_excel(results: List[dict], filepath: str) -> None:
    """
    Save a multi-day scrape (the output of scrape_kalimati_prices_range) as
    ONE workbook:
      - "Weekly Trend": one row per commodity, one column per date, holding
        that day's avg price — so you can see how each item moved across
        the whole range at a glance.
      - One tab per day, named after its date (e.g. "2026-07-26"),
        formatted the same way as the single-day export.

    `results` is expected oldest-first (as scrape_kalimati_prices_range
    returns it); the trend sheet keeps that same left-to-right order,
    ending with today in the rightmost column.
    """
    from openpyxl.utils import get_column_letter

    wb = Workbook()

    # ---- "Weekly Trend" sheet -------------------------------------------
    trend_ws = wb.active
    trend_ws.title = "Weekly Trend"

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(
        start_color="2E7D32", end_color="2E7D32", fill_type="solid"
    )
    title_font = Font(bold=True, size=13, color="1B5E20")
    subtitle_font = Font(italic=True, size=9, color="616161")
    center = Alignment(horizontal="center", vertical="center")

    n_days = len(results)
    last_col = 2 + n_days  # A=Commodity, B=Unit, then one column per day
    last_col_letter = get_column_letter(last_col)

    trend_ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=last_col)
    span = f"{results[0]['date']} to {results[-1]['date']}" if results else "n/a"
    trend_ws.cell(
        row=1,
        column=1,
        value=f"Kalimati Market — Avg Price Trend ({span})",
    )
    trend_ws["A1"].font = title_font
    trend_ws["A1"].alignment = center

    trend_ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=last_col)
    trend_ws.cell(
        row=2,
        column=1,
        value=f"Rs per unit, daily average    |    Source: {BASE_URL}{PRICE_PATH}",
    )
    trend_ws["A2"].font = subtitle_font
    trend_ws["A2"].alignment = center

    header_row = 4
    trend_ws.cell(row=header_row, column=1, value="Commodity")
    trend_ws.cell(row=header_row, column=2, value="Unit")
    for col_offset, day in enumerate(results):
        trend_ws.cell(
            row=header_row,
            column=3 + col_offset,
            value=day.get("date_label") or day["date"],
        )
    for col in range(1, last_col + 1):
        cell = trend_ws.cell(row=header_row, column=col)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center

    # Build commodity -> {unit, {day_index: avg_price}}, preserving the
    # order commodities first appear in across the range.
    commodity_order: List[str] = []
    commodity_unit: dict = {}
    commodity_prices: dict = {}
    for day_idx, day in enumerate(results):
        for item in day["items"]:
            name = item["commodity"]
            if name not in commodity_prices:
                commodity_prices[name] = {}
                commodity_unit[name] = item["unit"]
                commodity_order.append(name)
            commodity_prices[name][day_idx] = item["avg_price"]

    for row_offset, name in enumerate(commodity_order):
        r = header_row + 1 + row_offset
        trend_ws.cell(row=r, column=1, value=name)
        trend_ws.cell(row=r, column=2, value=commodity_unit[name])
        for day_idx in range(n_days):
            price = commodity_prices[name].get(day_idx)
            cell = trend_ws.cell(row=r, column=3 + day_idx, value=price)
            if price is not None:
                cell.number_format = "0.00"

    last_row = header_row + len(commodity_order)
    if commodity_order:
        trend_ws.auto_filter.ref = f"A{header_row}:{last_col_letter}{last_row}"
    trend_ws.freeze_panes = trend_ws.cell(row=header_row + 1, column=3).coordinate

    trend_ws.column_dimensions["A"].width = 34
    trend_ws.column_dimensions["B"].width = 10
    for col_offset in range(n_days):
        col_letter = get_column_letter(3 + col_offset)
        trend_ws.column_dimensions[col_letter].width = 14

    # ---- One tab per day --------------------------------------------------
    for day in results:
        ws = wb.create_sheet(title=day["date"][:31])
        _write_price_sheet(ws, day)

    wb.save(filepath)


# --------------------------------------------------------------------------
# FastAPI app
# --------------------------------------------------------------------------

kalimati_router = APIRouter(
    prefix="/kalimati",
    tags=["kalimati"]
)


@kalimati_router.get("/")
def root():
    return {
        "service": "Kalimati Market Price Scraper",
        "source": f"{BASE_URL}{PRICE_PATH}",
        "endpoints": {
            "GET /scrape?lang=en": "Scrape the latest price list and save it as an Excel file",
            "GET /prices?lang=en": "Scrape the latest price list, JSON only (no file saved)",
            "GET /scrape-week?lang=en&days=7": "Scrape the last N days and save them as ONE Excel file",
            "GET /prices-week?lang=en&days=7": "Scrape the last N days, JSON only (no file saved)",
            "GET /files": "List previously saved Excel files",
            "GET /download/{filename}": "Download a specific saved Excel file",
            "GET /download-latest": "Download the most recently saved Excel file",
        },
    }


@kalimati_router.get("/prices", response_model=ScrapeResult)
def get_prices(lang: str = "en"):
    if lang not in ("en", "np"):
        raise HTTPException(status_code=400, detail="lang must be 'en' or 'np'")
    try:
        return scrape_kalimati_prices(lang=lang)
    except requests.RequestException as e:
        raise HTTPException(
            status_code=502, detail=f"Could not reach kalimatimarket.gov.np: {e}"
        )
    except RuntimeError as e:
        raise HTTPException(status_code=404, detail=str(e))


@kalimati_router.get("/scrape")
def scrape_and_save(lang: str = "en"):
    if lang not in ("en", "np"):
        raise HTTPException(status_code=400, detail="lang must be 'en' or 'np'")
    try:
        data = scrape_kalimati_prices(lang=lang)
    except requests.RequestException as e:
        raise HTTPException(
            status_code=502, detail=f"Could not reach kalimatimarket.gov.np: {e}"
        )
    except RuntimeError as e:
        raise HTTPException(status_code=404, detail=str(e))

    filename = f"kalimati_prices_{data['date']}_{lang}.xlsx"
    filepath = os.path.join(OUTPUT_DIR, filename)
    save_to_excel(data, filepath)

    return {
        "status": "success",
        "date": data["date"],
        "date_label": data["date_label"],
        "items_scraped": data["count"],
        "file": filename,
        "download_url": f"/download/{filename}",
    }


@kalimati_router.get("/prices-week")
def get_prices_week(lang: str = "en", days: int = 7):
    if lang not in ("en", "np"):
        raise HTTPException(status_code=400, detail="lang must be 'en' or 'np'")
    if not (1 <= days <= 31):
        raise HTTPException(status_code=400, detail="days must be between 1 and 31")
    try:
        results = scrape_kalimati_prices_range(lang=lang, days=days)
    except requests.RequestException as e:
        raise HTTPException(
            status_code=502, detail=f"Could not reach kalimatimarket.gov.np: {e}"
        )
    return {
        "lang": lang,
        "days_requested": days,
        "days_with_data": sum(1 for r in results if r["count"] > 0),
        "results": results,
    }


@kalimati_router.get("/scrape-week")
def scrape_and_save_week(lang: str = "en", days: int = 7):
    if lang not in ("en", "np"):
        raise HTTPException(status_code=400, detail="lang must be 'en' or 'np'")
    if not (1 <= days <= 31):
        raise HTTPException(status_code=400, detail="days must be between 1 and 31")
    try:
        results = scrape_kalimati_prices_range(lang=lang, days=days)
    except requests.RequestException as e:
        raise HTTPException(
            status_code=502, detail=f"Could not reach kalimatimarket.gov.np: {e}"
        )

    start, end = results[0]["date"], results[-1]["date"]
    filename = f"kalimati_prices_{start}_to_{end}_{lang}.xlsx"
    filepath = os.path.join(OUTPUT_DIR, filename)
    save_range_to_excel(results, filepath)

    return {
        "status": "success",
        "date_range": {"from": start, "to": end},
        "days_scraped": len(results),
        "days_with_data": sum(1 for r in results if r["count"] > 0),
        "file": filename,
        "download_url": f"/download/{filename}",
    }


@kalimati_router.get("/files")
def list_files():
    files = sorted(glob.glob(os.path.join(OUTPUT_DIR, "*.xlsx")), reverse=True)
    return {"files": [os.path.basename(f) for f in files]}


@kalimati_router.get("/download/{filename}")
def download_file(filename: str):
    safe_name = os.path.basename(filename)  # guard against path traversal
    filepath = os.path.join(OUTPUT_DIR, safe_name)
    if not os.path.isfile(filepath):
        raise HTTPException(
            status_code=404, detail="File not found. Call /scrape first."
        )
    return FileResponse(
        filepath,
        filename=safe_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@kalimati_router.get("/download-latest")
def download_latest():
    files = sorted(glob.glob(os.path.join(OUTPUT_DIR, "*.xlsx")))
    if not files:
        raise HTTPException(status_code=404, detail="No files yet. Call /scrape first.")
    latest = files[-1]
    return FileResponse(
        latest,
        filename=os.path.basename(latest),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("kalimati_price_scraper:app", host="0.0.0.0", port=8000, reload=True)
