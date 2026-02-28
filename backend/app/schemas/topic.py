from pydantic import BaseModel


class TopicResponse(BaseModel):
    id: int
    name: str
    slug: str

    class Config:
        from_attributes = True
