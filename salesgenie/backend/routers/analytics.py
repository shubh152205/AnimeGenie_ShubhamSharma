from fastapi import APIRouter

from database import fetchall

router = APIRouter(prefix="/api", tags=["Analytics"])


@router.get("/analytics")
def get_analytics():
    rows = fetchall("SELECT COUNT(*) as count FROM leads")
    total_leads = rows[0]['count'] if rows else 0

    rows = fetchall("SELECT AVG(score) as avg_score FROM leads")
    avg_score = round(rows[0]['avg_score'] or 0.0, 1) if rows else 0.0

    rows = fetchall("SELECT COUNT(*) as count FROM leads WHERE score >= 85")
    hot_leads = rows[0]['count'] if rows else 0

    rows = fetchall("SELECT COUNT(*) as count FROM leads WHERE stage = 'Closed Won'")
    closed_won = rows[0]['count'] if rows else 0

    stages = [dict(r) for r in fetchall("SELECT stage, COUNT(*) as count FROM leads GROUP BY stage")]
    industries = [dict(r) for r in fetchall("SELECT industry, COUNT(*) as count FROM leads GROUP BY industry")]
    locations = [
        dict(r) for r in fetchall(
            "SELECT location, AVG(score) as avg_score, COUNT(*) as count FROM leads GROUP BY location"
        )
    ]
    scatter_data = [
        dict(r) for r in fetchall(
            "SELECT company, email_opens, website_visits, score, stage FROM leads"
        )
    ]

    industry_conversion_rows = fetchall(
        """SELECT industry, COUNT(*) as total,
                  SUM(CASE WHEN stage = 'Closed Won' THEN 1 ELSE 0 END) as won
           FROM leads GROUP BY industry"""
    )
    industry_conversion = []
    for r in industry_conversion_rows:
        d = dict(r)
        d['conversion_rate'] = round((d['won'] / d['total']) * 100, 1) if d['total'] > 0 else 0.0
        industry_conversion.append(d)

    return {
        "summary": {
            "total_leads": total_leads,
            "avg_score": avg_score,
            "hot_leads": hot_leads,
            "closed_won": closed_won,
            "conversion_rate": round(
                (closed_won / total_leads * 100) if total_leads > 0 else 0.0, 1
            ),
        },
        "stages": stages,
        "industries": industries,
        "locations": locations,
        "scatter_data": scatter_data,
        "industry_conversion": industry_conversion,
    }
