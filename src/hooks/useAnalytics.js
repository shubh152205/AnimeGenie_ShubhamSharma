import { useState, useCallback } from 'react';
import { API_BASE } from '../constants';

export function useAnalytics({ showToast }) {
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`${API_BASE}/analytics`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      showToast?.("Error loading analytics data", "error");
    } finally {
      setLoadingAnalytics(false);
    }
  }, [showToast]);

  return { analytics, loadingAnalytics, fetchAnalytics };
}
