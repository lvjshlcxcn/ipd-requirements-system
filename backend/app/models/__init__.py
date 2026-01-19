"""Models module - Import all models for Alembic autogenerate."""
from app.models.user import User
from app.models.tenant import Tenant
from app.models.requirement import Requirement, Requirement10QAnswer
from app.models.requirement_version import RequirementVersion
from app.models.appeals import AppealsAnalysis
from app.models.kano import KanoClassification
from app.models.sp import StrategicPlan
from app.models.bp import BusinessPlan
from app.models.charter import Charter
from app.models.pcr import PCRRequest
from app.models.rtm import TraceabilityLink
from app.models.verification import VerificationRecord
from app.models.workflow import WorkflowHistory
from app.models.attachment import Attachment
from app.models.notification import Notification
from app.models.verification_checklist import VerificationChecklist
from app.models.import_job import ImportJob
from app.models.export_job import ExportJob
from app.models.cim_reference import CIMReference, RequirementCIMLink
from app.models.feedback import Feedback
from app.models.verification_metric import VerificationMetric
from app.models.review import Review

__all__ = [
    # Core models
    "Tenant",
    "User",
    # Requirement models
    "Requirement",
    "Requirement10QAnswer",
    "RequirementVersion",
    # Analysis models
    "AppealsAnalysis",
    "KanoClassification",
    # Distribution models
    "StrategicPlan",
    "BusinessPlan",
    "Charter",
    "PCRRequest",
    # Traceability models
    "TraceabilityLink",
    # Verification models
    "VerificationRecord",
    "VerificationChecklist",
    # Workflow and audit
    "WorkflowHistory",
    # Attachments
    "Attachment",
    # Notifications
    "Notification",
    # Import/Export
    "ImportJob",
    "ExportJob",
    # CIM references
    "CIMReference",
    "RequirementCIMLink",
    # Phase 2: Feedback and verification
    "Feedback",
    "VerificationMetric",
    "Review",
]
