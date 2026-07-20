import { useState, useCallback } from 'react';
import { API_BASE } from '../constants';

export function useOutreach({ showToast }) {
  const [outreachLeadId, setOutreachLeadId] = useState("");
  const [outreachChannel, setOutreachChannel] = useState("Email");
  const [outreachTone, setOutreachTone] = useState("Persuasive");
  const [generatedOutreach, setGeneratedOutreach] = useState(null);
  const [generatingOutreach, setGeneratingOutreach] = useState(false);

  const handleGenerateOutreach = useCallback(async () => {
    if (!outreachLeadId) return;
    setGeneratingOutreach(true);
    try {
      const res = await fetch(`${API_BASE}/generate-outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: parseInt(outreachLeadId),
          channel: outreachChannel,
          tone: outreachTone
        })
      });
      if (!res.ok) throw new Error("Failed to generate outreach");
      const data = await res.json();
      setGeneratedOutreach(data);
      showToast?.("AI Outreach Pitch Generated!");
    } catch (err) {
      console.error(err);
      showToast?.("Error generating outreach message", "error");
    } finally {
      setGeneratingOutreach(false);
    }
  }, [outreachLeadId, outreachChannel, outreachTone, showToast]);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
    showToast?.("Outreach pitch copied to clipboard!");
  }, [showToast]);

  return {
    outreachLeadId, setOutreachLeadId,
    outreachChannel, setOutreachChannel,
    outreachTone, setOutreachTone,
    generatedOutreach, setGeneratedOutreach,
    generatingOutreach,
    handleGenerateOutreach,
    copyToClipboard
  };
}
