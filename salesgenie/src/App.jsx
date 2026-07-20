import React, { useState, useEffect } from 'react';
import Toast from './components/Toast';
import Sidebar from './components/Sidebar';
import MobileTopBar from './components/MobileTopBar';
import LeadsExplorer from './pages/LeadsExplorer';
import DealPipeline from './pages/DealPipeline';
import AIOutreachGenerator from './pages/AIOutreachGenerator';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import { useToast } from './hooks/useToast';
import { useLeads } from './hooks/useLeads';
import { useLeadDetail } from './hooks/useLeadDetail';
import { useAnalytics } from './hooks/useAnalytics';
import { useOutreach } from './hooks/useOutreach';
import { useLeadActions } from './hooks/useLeadActions';

export default function App() {
  const [activeTab, setActiveTab] = useState("Leads Explorer");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { toast, showToast } = useToast();

  // Leads list state & fetch
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [sortOrder, setSortOrder] = useState("desc");

  const { leads, selectedLeadId, setSelectedLeadId, loadingList, fetchLeads } = useLeads({
    searchQuery, selectedIndustry, selectedStage, sortBy, sortOrder, showToast
  });

  // Lead detail
  const { leadDetail, setLeadDetail, loadingDetail, fetchLeadDetail } = useLeadDetail({
    selectedLeadId, showToast
  });

  // Analytics
  const { analytics, loadingAnalytics, fetchAnalytics } = useAnalytics({ showToast });

  // Lead actions (activity, stage change, delete)
  const { handleQuickActivity, handleStageChange, handleDeleteLead } = useLeadActions({
    showToast, selectedLeadId, fetchLeadDetail, fetchLeads, setSelectedLeadId, setLeadDetail, fetchAnalytics
  });

  // Outreach
  const {
    outreachLeadId, setOutreachLeadId,
    outreachChannel, setOutreachChannel,
    outreachTone, setOutreachTone,
    generatedOutreach, generatingOutreach,
    handleGenerateOutreach, copyToClipboard
  } = useOutreach({ showToast });

  // Sync outreach lead selection
  useEffect(() => {
    if (leads.length > 0 && !outreachLeadId) {
      setOutreachLeadId(leads[0].id.toString());
    }
  }, [leads, outreachLeadId, setOutreachLeadId]);

  const handleTabChange = (name) => {
    setActiveTab(name);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      
      <Toast message={toast?.message} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileTopBar onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex flex-1 overflow-hidden">
          {/* Tab 1: Leads Explorer */}
          {activeTab === "Leads Explorer" && (
            <LeadsExplorer
              leads={leads}
              selectedLeadId={selectedLeadId} setSelectedLeadId={setSelectedLeadId}
              loadingList={loadingList}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              selectedIndustry={selectedIndustry} setSelectedIndustry={setSelectedIndustry}
              selectedStage={selectedStage} setSelectedStage={setSelectedStage}
              sortBy={sortBy} setSortBy={setSortBy}
              sortOrder={sortOrder} setSortOrder={setSortOrder}
              leadDetail={leadDetail} loadingDetail={loadingDetail}
              onStageChange={handleStageChange}
              onDelete={handleDeleteLead}
              onQuickActivity={handleQuickActivity}
              fetchLeads={fetchLeads}
              fetchLeadDetail={fetchLeadDetail}
              fetchAnalytics={fetchAnalytics}
              showToast={showToast}
            />
          )}

          {/* Tab 2: Deal Pipeline */}
          {activeTab === "Deal Pipeline" && (
            <DealPipeline
              leads={leads}
              onStageChange={handleStageChange}
              onTabChange={handleTabChange}
              onSelectLead={setSelectedLeadId}
            />
          )}

          {/* Tab 3: AI Outreach Generator */}
          {activeTab === "AI Outreach Generator" && (
            <AIOutreachGenerator
              leads={leads}
              outreachLeadId={outreachLeadId} setOutreachLeadId={setOutreachLeadId}
              outreachChannel={outreachChannel} setOutreachChannel={setOutreachChannel}
              outreachTone={outreachTone} setOutreachTone={setOutreachTone}
              generatedOutreach={generatedOutreach}
              generatingOutreach={generatingOutreach}
              onGenerate={handleGenerateOutreach}
              onCopy={copyToClipboard}
            />
          )}

          {/* Tab 4: Analytics Dashboard */}
          {activeTab === "Analytics Dashboard" && (
            <AnalyticsDashboard
              analytics={analytics}
              loadingAnalytics={loadingAnalytics}
              fetchAnalytics={fetchAnalytics}
            />
          )}
        </div>
      </div>
    </div>
  );
}
