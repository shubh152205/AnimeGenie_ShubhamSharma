import { Sparkles, X } from 'lucide-react';
import { INDUSTRIES } from '../constants';

export default function LeadRegisterForm({ formData, setFormData, onClose, onSubmit }) {
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Add Prospect Lead</h2>
          <p className="text-xs text-slate-500 font-medium">Add company profile, stack, and engagement indicators</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded p-1">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Company Name</label>
            <input type="text" required value={formData.company} onChange={(e) => handleChange("company", e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Contact Name</label>
            <input type="text" required value={formData.contact_name} onChange={(e) => handleChange("contact_name", e.target.value)}
              placeholder="e.g. Jane Smith"
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Designation</label>
            <input type="text" required value={formData.designation} onChange={(e) => handleChange("designation", e.target.value)}
              placeholder="e.g. CTO"
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Industry</label>
            <select value={formData.industry} onChange={(e) => handleChange("industry", e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none">
              {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Email Address</label>
            <input type="email" required value={formData.email} onChange={(e) => handleChange("email", e.target.value)}
              placeholder="e.g. jane.smith@acme.com"
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Phone Number</label>
            <input type="text" required value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="e.g. +1-555-0100"
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Employees</label>
            <input type="number" required value={formData.employees} onChange={(e) => handleChange("employees", parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Annual Revenue</label>
            <input type="text" required value={formData.revenue} onChange={(e) => handleChange("revenue", e.target.value)}
              placeholder="e.g. $15M"
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Location</label>
            <input type="text" required value={formData.location} onChange={(e) => handleChange("location", e.target.value)}
              placeholder="e.g. San Francisco"
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Funding Stage</label>
            <select value={formData.funding} onChange={(e) => handleChange("funding", e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none">
              <option value="Seed">Seed</option>
              <option value="Series A">Series A</option>
              <option value="Series B">Series B</option>
              <option value="Series C">Series C</option>
              <option value="Late Stage">Late Stage</option>
              <option value="Public">Public</option>
              <option value="Bootstrapped">Bootstrapped</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Technology Stack</label>
            <input type="text" required value={formData.technology} onChange={(e) => handleChange("technology", e.target.value)}
              placeholder="e.g. React, AWS, Node.js"
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Core Pain Point</label>
          <textarea value={formData.pain_point} onChange={(e) => handleChange("pain_point", e.target.value)}
            placeholder="e.g. Slow feature development cycles and server scaling issues."
            rows={2}
            className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none" />
        </div>

        <div className="border-t border-slate-100 pt-3 mt-3">
          <h4 className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider mb-3">Engagement Metrics</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-1">Website Visits</label>
              <input type="number" value={formData.website_visits} onChange={(e) => handleChange("website_visits", parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-1">Email Opens</label>
              <input type="number" value={formData.email_opens} onChange={(e) => handleChange("email_opens", parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="demo_request" checked={formData.demo_request === 1}
                onChange={(e) => handleChange("demo_request", e.target.checked ? 1 : 0)}
                className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
              <label htmlFor="demo_request" className="text-xs font-bold text-slate-600">Demo Requested?</label>
            </div>
          </div>
        </div>

        <button type="submit"
          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 p-3 text-xs font-bold text-white shadow-md shadow-indigo-600/15 hover:bg-indigo-700 transition-colors">
          <Sparkles className="h-4.5 w-4.5" />
          <span>Calculate Score & Add Lead</span>
        </button>
      </form>
    </div>
  );
}
