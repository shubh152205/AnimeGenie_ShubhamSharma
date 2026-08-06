import { useCallback } from 'react';
import { API_BASE } from '../constants';

export function useLeadActions({ showToast, selectedLeadId, fetchLeadDetail, fetchLeads, setSelectedLeadId, setLeadDetail, fetchAnalytics }) {

  const handleQuickActivity = useCallback(async (activityName, status = "Completed") => {
    if (!selectedLeadId) return;
    try {
      const res = await fetch(`${API_BASE}/leads/${selectedLeadId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity: activityName, status })
      });
      if (!res.ok) throw new Error("Failed to log activity");
      showToast?.(`Logged activity: ${activityName}`);
      fetchLeadDetail?.(selectedLeadId);
      fetchLeads?.(false);
      fetchAnalytics?.();
    } catch (err) {
      console.error(err);
      showToast?.("Error logging activity", "error");
    }
  }, [selectedLeadId, showToast, fetchLeadDetail, fetchLeads, fetchAnalytics]);

  const handleStageChange = useCallback(async (leadId, newStage) => {
    try {
      const leadRes = await fetch(`${API_BASE}/leads/${leadId}`);
      if (!leadRes.ok) throw new Error("Lead not found");
      const currentLead = await leadRes.json();

      const updatedLead = {
        ...currentLead,
        stage: newStage,
        converted: newStage === "Closed Won" ? 1 : 0
      };

      const res = await fetch(`${API_BASE}/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLead)
      });
      if (!res.ok) throw new Error("Failed to update lead stage");

      await fetch(`${API_BASE}/leads/${leadId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity: `Stage changed to ${newStage}`, status: "Completed" })
      });

      showToast?.(`Lead stage updated to ${newStage}`);
      if (selectedLeadId === leadId) {
        fetchLeadDetail?.(leadId);
      }
      fetchLeads?.(false);
      fetchAnalytics?.();
    } catch (err) {
      console.error(err);
      showToast?.("Error updating stage", "error");
    }
  }, [selectedLeadId, showToast, fetchLeadDetail, fetchLeads, fetchAnalytics]);

  const handleDeleteLead = useCallback(async (leadId) => {
    if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/leads/${leadId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete lead");
      showToast?.("Lead deleted successfully");
      setSelectedLeadId?.(null);
      setLeadDetail?.(null);
      fetchLeads?.(true);
      fetchAnalytics?.();
    } catch (err) {
      console.error(err);
      showToast?.("Error deleting lead", "error");
    }
  }, [showToast, setSelectedLeadId, setLeadDetail, fetchLeads, fetchAnalytics]);

  return { handleQuickActivity, handleStageChange, handleDeleteLead };
}
