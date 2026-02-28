from sqlalchemy import Column, Integer, String

from app.db.base import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False, unique=True)
    slug = Column(String(200), nullable=False, unique=True)
