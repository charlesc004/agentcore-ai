from sqlalchemy import select
from fastapi import HTTPException


class Repository:
    def __init__(self, db, model, organization_id):
        self.db, self.model, self.organization_id = db, model, organization_id

    def query(self):
        return select(self.model).where(self.model.organization_id == self.organization_id)

    def list(self, limit=100, offset=0):
        return list(
            self.db.scalars(
                self.query().order_by(self.model.created_at.desc()).limit(limit).offset(offset)
            )
        )

    def get(self, identifier):
        obj = self.db.scalar(self.query().where(self.model.id == identifier))
        if obj is None:
            raise HTTPException(404, "Resource not found")
        return obj

    def create(self, values):
        obj = self.model(organization_id=self.organization_id, **values)
        self.db.add(obj)
        self.db.flush()
        return obj
