import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import LeadFilters from '../components/LeadFilters';
import LeadCard from '../components/LeadCard';
import LeadRegisterForm from '../components/LeadRegisterForm';
import LeadDetailView from './LeadDetailView';
import { EMPTY_FORM, API_BASE } from '../constants';

export default function LeadsExplorer({
  leads, selectedLeadId, setSelectedLeadId, loadingList,
  searchQuery, setSearchQuery,
  selectedIndustry, setSelectedIndustry,
  selectedStage, setSelectedStage,
  sortBy, setSortBy, sortOrder, setSortOrder,
  leadDetail,
  onStageChange, onDelete, onQuickActivity,
  fetchLeads, fetchAnalytics, showToast
}) {
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed to create lead");
      const data = await res.json();
      showToast?.("New prospect lead created successfully!");
      setShowRegisterForm(false);
      setSelectedLeadId?.(data.lead_id);
      fetchLeads?.();
      fetchAnalytics?.();
      setFormData(EMPTY_FORM);
    } catch (err) {
      console.error(err);
      showToast?.("Error creating lead", "error");
    }
  };

  const openRegisterForm = () => {
    setShowRegisterForm(true);
    setSelectedLeadId?.(null);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT PANEL: Leads List */}
      <section className="flex flex-col border-r border-slate-200 bg-white w-full md:w-80 lg:w-[420px] shrink-0">
        <LeadFilters
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          selectedIndustry={selectedIndustry} setSelectedIndustry={setSelectedIndustry}
          selectedStage={selectedStage} setSelectedStage={setSelectedStage}
          sortBy={sortBy} setSortBy={setSortBy}
          sortOrder={sortOrder} setSortOrder={setSortOrder}
          onRegisterClick={openRegisterForm}
        />

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-3 space-y-2.5">
          {loadingList ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <RefreshCw className="h-7 w-7 animate-spin text-indigo-500 mb-2" />
              <span className="text-xs font-semibold">Retrieving leads list...</span>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold">No leads found</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Try adjusting your search criteria or add a new prospect.</p>
            </div>
          ) : (
            leads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                isSelected={selectedLeadId === lead.id}
                onClick={() => { setSelectedLeadId?.(lead.id); setShowRegisterForm(false); }}
              />
            ))
          )}
        </div>
      </section>

      {/* RIGHT PANEL: Details or Registration Form */}
      <section className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto p-4 md:p-6">
        {showRegisterForm ? (
          <LeadRegisterForm
            formData={formData}
            setFormData={setFormData}
            onClose={() => setShowRegisterForm(false)}
            onSubmit={handleRegisterSubmit}
          />
        ) : (
          <LeadDetailView
            leadDetail={leadDetail}
            onStageChange={onStageChange}
            onDelete={onDelete}
            onQuickActivity={onQuickActivity}
            onSelectDeal={(id) => setSelectedLeadId?.(id)}
          />
        )}
      </section>
    </div>
  );
}
