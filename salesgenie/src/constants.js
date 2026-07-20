export const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "http://127.0.0.1:8000/api";

export const SALES_STAGES = [
  { id: "Lead", label: "New Lead", color: "bg-slate-100 border-slate-200 text-slate-700", dot: "bg-slate-400" },
  { id: "Contacted", label: "Contacted", color: "bg-indigo-50 border-indigo-200 text-indigo-700", dot: "bg-indigo-500" },
  { id: "Product Demo", label: "Demo Scheduled", color: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500" },
  { id: "Proposal Sent", label: "Proposal Sent", color: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500" },
  { id: "Negotiation", label: "Negotiation", color: "bg-purple-50 border-purple-200 text-purple-700", dot: "bg-purple-500" },
  { id: "Closed Won", label: "Closed Won", color: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500" }
];

export const OUR_PRODUCT_STACK = ["React", "Node.js", "AWS", "PostgreSQL", "Python", "Kubernetes", "FastAPI"];

export const INDUSTRIES = ["Technology", "Healthcare", "Education", "Finance", "Retail", "Logistics"];

export const TABS = [
  { name: "Leads Explorer", label: "Leads Explorer" },
  { name: "Deal Pipeline", label: "Sales Pipeline" },
  { name: "AI Outreach Generator", label: "AI Outreach Writer" },
  { name: "Analytics Dashboard", label: "Sales Analytics" }
];

export const EMPTY_FORM = {
  company: "Acme Corp",
  contact_name: "Jane Smith",
  designation: "CTO",
  email: "jane.smith@acme.com",
  phone: "+1-555-0100",
  industry: "Technology",
  employees: 120,
  revenue: "$15M",
  location: "San Francisco",
  funding: "Series A",
  technology: "React, AWS, Node.js",
  pain_point: "Slow feature development cycles and server scaling issues.",
  email_opens: 0,
  website_visits: 0,
  demo_request: 0,
  converted: 0,
  stage: "Lead"
};

export const OUTREACH_CHANNELS = [
  { val: "Email", label: "✉️ Cold Email" },
  { val: "LinkedIn", label: "💬 LinkedIn Message" },
  { val: "WhatsApp", label: "🟢 WhatsApp Chat" },
  { val: "SMS", label: "📱 Text message" }
];

export const OUTREACH_TONES = [
  { val: "Professional", label: "👔 Professional" },
  { val: "Persuasive", label: "🎯 Persuasive" },
  { val: "Friendly", label: "😊 Friendly" },
  { val: "Urgent", label: "⚡ Urgent" }
];

export const SORT_OPTIONS = [
  { val: "score", label: "AI Lead Score" },
  { val: "company", label: "Company Name" },
  { val: "location", label: "Location" }
];
