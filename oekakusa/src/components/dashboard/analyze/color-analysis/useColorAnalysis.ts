import { useState } from "react";
import { ColorResult } from "../types";

const COLOR_API_URL = import.meta.env.VITE_COLOR_API_URL;

export const useColorAnalysis = (selectedFile: File | null) => {
  const [colorResults, setColorResults] = useState<ColorResult | null>(null);
  const [colorLoading, setColorLoading] = useState(false);
  const [colorError, setColorError] = useState<string | null>(null);

  const resetColor = () => {
    setColorResults(null);
    setColorError(null);
    setColorLoading(false);
  };

  const analyzeColor = async () => {
    if (!selectedFile) return;
    setColorLoading(true);
    setColorError(null);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch(`${COLOR_API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }
      const data = await response.json();
      setColorResults(data);
    } catch (e: any) {
      setColorError(e.message || "Analysis failed");
    } finally {
      setColorLoading(false);
    }
  };

  return {
    colorResults,
    setColorResults, // Exposed for parent reset if needed
    colorLoading,
    colorError,
    analyzeColor,
    resetColor,
  };
};
