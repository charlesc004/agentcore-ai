from app.shared.repository import Repository
from app.shared.models import Workflow, AuditEvent
from app.modules.workflows.validation import validate_graph


class CatalogService:
    def __init__(self, db, user):
        self.db, self.user = db, user

    def save(self, model, values, identifier=None):
        repo = Repository(self.db, model, self.user.organization_id)
        if model == Workflow and values["status"] == "active":
            validate_graph(values["nodes"], values["edges"])
        obj = repo.get(identifier) if identifier else repo.create(values)
        for key, value in values.items():
            setattr(obj, key, value)
        self.db.add(
            AuditEvent(
                organization_id=self.user.organization_id,
                actor=self.user.email,
                action=model.__tablename__ + (".updated" if identifier else ".created"),
                detail=obj.name,
            )
        )
        self.db.commit()
        return obj
