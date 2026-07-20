from fastapi import APIRouter, HTTPException

from database import fetchone
from models import OutreachRequest

router = APIRouter(prefix="/api", tags=["Outreach"])


@router.post("/generate-outreach")
def generate_outreach(req: OutreachRequest):
    row = fetchone("SELECT * FROM leads WHERE id = ?", (req.lead_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = dict(row)
    company = lead['company']
    name = lead['contact_name']
    designation = lead['designation']
    industry = lead['industry']
    location = lead['location']
    funding = lead['funding']
    pain_point = lead.get('pain_point') or ""
    revenue = lead['revenue']

    # Analyze pain point for customized copy
    if pain_point:
        pain_summary = f"addressing your current challenges with {pain_point.lower().rstrip('.')}"
    else:
        pain_summary = "optimizing your operational workflows and reducing overhead costs"

    # Industry-specific case study referencing
    ind_lower = industry.lower() if industry else ""
    if "tech" in ind_lower or "technology" in ind_lower:
        case_study_ref = " Notably, we recently assisted TechCorp with similar scaling challenges."
    elif "health" in ind_lower or "healthcare" in ind_lower:
        case_study_ref = " Notably, we recently assisted MediLife with streamlining their patient data workflows."
    else:
        case_study_ref = ""

    # Build tone-specific advisory text
    tone_str = req.tone.lower()
    if tone_str == "persuasive":
        salutation = f"Hi {name},"
        opening = f"I've been following {company}'s impressive growth in the {industry} sector and noticed your focus on scaling operations."
        core = f"Given your role as {designation}, you know how critical efficiency is. Our platform is designed specifically to help companies in {location} like yours with {pain_summary}. With {company}'s current revenue scale at {revenue} and recent {funding} backing, implementing our solution could drive significant bottom-line impact.{case_study_ref}"
        call_to_action = "Can we schedule a 10-minute demo next Tuesday to show you the potential ROI?"
        signoff = "Best regards,\nSalesGenie AI Outreach Team"
    elif tone_str == "friendly":
        salutation = f"Hello {name},"
        opening = f"Hope you're having a great week! I was looking into {company} and wanted to reach out."
        core = f"It looks like you guys are doing amazing work in the {industry} space. I know as {designation} you've got a lot on your plate, especially when it comes to {pain_summary}. We've helped similar {funding} stage companies in {location} streamline their processes and would love to see if we can do the same for you.{case_study_ref}"
        call_to_action = "Let me know if you have time for a quick virtual coffee chat next week!"
        signoff = "Cheers,\nSalesGenie Team"
    elif tone_str == "urgent":
        salutation = f"Dear {name},"
        opening = f"I am reaching out regarding a critical efficiency gap we've identified at {company}."
        core = f"With {company} operating at a {revenue} scale, bottlenecks around {pain_summary} can cost thousands daily. As {designation}, addressing this immediately is paramount. Our intelligence platform helps {funding} companies in {location} rapidly mitigate these issues and lock in operational savings.{case_study_ref}"
        call_to_action = "Please let me know your availability for an urgent 15-minute briefing this Thursday."
        signoff = "Sincerely,\nSalesGenie AI Acceleration Desk"
    else:  # Professional
        salutation = f"Dear {name},"
        opening = f"I am writing to you regarding potential optimization strategies for {company}'s operations."
        core = f"As the {designation} at {company}, you are likely focused on key strategic outcomes within the {industry} industry. Our platform specializing in {pain_summary} offers custom enterprise integrations. Given {company}'s base in {location} and current {funding} status, we see an excellent alignment for a partnership.{case_study_ref}"
        call_to_action = "Please advise if you would be open to a formal introductory call to discuss this further."
        signoff = "Best regards,\nSalesGenie AI Enterprise Solutions"

    # Channel-specific formatting
    channel_str = req.channel.lower()
    if channel_str == "linkedin":
        subject = f"Connecting regarding {company}"
        body = f"{salutation}\n\n{opening} I wanted to connect regarding your role as {designation} at {company}. We have been working with similar {industry} firms in {location} to help them with {pain_summary}.{case_study_ref}\n\nLet's connect! {call_to_action}\n\n{signoff}"
    elif channel_str == "whatsapp":
        subject = f"Business Inquiry - {company}"
        body = (
            f"👋 *SalesGenie AI | Prospect Outreach* 👋\n\n"
            f"{salutation}\n"
            f"Hope you're well. Reaching out to you as {designation} of {company}. "
            f"We specialize in helping {funding} companies in {location} solve issues with *{pain_point}*. {case_study_ref}🚀\n"
            f"👉 {call_to_action}\n\n- SalesGenie Team"
        )
    elif channel_str == "sms":
        subject = "SMS Outreach"
        body = (
            f"SalesGenie AI: Hello {name}, wanted to connect regarding {company}'s needs in {industry}. "
            f"We help solve {pain_point}. Let's chat! Reply YES to book a call. - SalesGenie"
        )
    else:  # Email
        subject = f"Operational Optimization Proposal for {company}"
        body = f"Subject: {subject}\n\n{salutation}\n\n{opening}\n\n{core}\n\n{call_to_action}\n\n{signoff}"

    return {
        "channel": req.channel,
        "tone": req.tone,
        "subject": subject,
        "message": body,
    }
