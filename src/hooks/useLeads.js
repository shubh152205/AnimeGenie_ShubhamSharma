import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../constants';

export function useLeads({ searchQuery, selectedIndustry, selectedStage, sortBy, sortOrder, showToast }) {
  const [leads, setLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [loadingList, setLoadingList] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoadingList(true);
    try {
      let url = `${API_BASE}/leads?sort_by=${sortBy}&sort_order=${sortOrder}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedIndustry) url += `&industry=${encodeURIComponent(selectedIndustry)}`;
      if (selectedStage) url += `&stage=${encodeURIComponent(selectedStage)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      setLeads(data);

      if (data.length > 0) {
        setSelectedLeadId(currentId => {
          if (currentId && data.some(l => l.id === currentId)) {
            return currentId;
          }
          return data[0].id;
        });
      } else {
        setSelectedLeadId(null);
      }
    } catch (err) {
      console.error(err);
      showToast?.("Error loading leads list", "error");
    } finally {
      setLoadingList(false);
    }
  }, [searchQuery, selectedIndustry, selectedStage, sortBy, sortOrder, showToast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, setLeads, selectedLeadId, setSelectedLeadId, loadingList, fetchLeads };
}
