import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../constants';

export function useLeadDetail({ selectedLeadId, showToast }) {
  const [leadDetail, setLeadDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchLeadDetail = useCallback(async (id) => {
    if (!id) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE}/leads/${id}`);
      if (!res.ok) throw new Error("Failed to fetch lead details");
      const data = await res.json();
      setLeadDetail(data);
    } catch (err) {
      console.error(err);
      showToast?.("Error loading lead details", "error");
    } finally {
      setLoadingDetail(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (selectedLeadId) {
      fetchLeadDetail(selectedLeadId);
    } else {
      setLeadDetail(null);
    }
  }, [selectedLeadId, fetchLeadDetail, setLeadDetail]);

  return { leadDetail, setLeadDetail, loadingDetail, fetchLeadDetail };
}
