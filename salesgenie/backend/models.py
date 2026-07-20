from pydantic import BaseModel
from typing import Optional


class ActivityCreate(BaseModel):
    activity: str
    status: str


class LeadCreate(BaseModel):
    company: str
    contact_name: str
    designation: str
    email: str
    phone: str
    industry: str
    employees: int
    revenue: str
    location: str
    funding: str
    technology: str
    pain_point: Optional[str] = ""
    email_opens: Optional[int] = 0
    website_visits: Optional[int] = 0
    demo_request: Optional[int] = 0
    converted: Optional[int] = 0
    stage: Optional[str] = "Lead"


class OutreachRequest(BaseModel):
    lead_id: int
    channel: str
    tone: str
