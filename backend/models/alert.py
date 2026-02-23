from datetime import datetime

from pydantic import BaseModel


class Alert(BaseModel):
    id: str
    shipment_id: str
    alert_type: str
    severity: str
    message: str
    is_read: bool
    created_at: datetime


class AlertUpdate(BaseModel):
    is_read: bool
