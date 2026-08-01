from sqlalchemy.orm import Session
from app import models, schemas


def create_post(db: Session, post: schemas.MarketplaceCreate):
    new_post = models.MarketplacePost(**post.model_dump())
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


def get_posts(db: Session):
    return db.query(models.MarketplacePost).order_by(models.MarketplacePost.id.desc()).all()
