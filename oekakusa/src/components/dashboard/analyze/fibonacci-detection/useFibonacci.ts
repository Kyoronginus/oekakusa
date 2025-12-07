import { useState, useEffect } from "react";

const FIBONACCI_API_URL = import.meta.env.VITE_FIBONACCI_API_URL;

export const useFibonacci = (
  selectedFile: File | null,
  setPreviewUrl: (url: string | null) => void // Shared preview setter
) => {
  const [kValue, setKValue] = useState("0");
  const [bWeight, setBWeight] = useState("1000");
  const [fibResult, setFibResult] = useState<string | null>(null);
  const [fibLoading, setFibLoading] = useState(false);
  const [fibError, setFibError] = useState<string | null>(null);

  const resetFibonacci = () => {
    setKValue("0");
    setBWeight("1000");
    setFibResult(null);
    setFibError(null);
    setFibLoading(false);
  };

  const handleFibonacciPreview = async () => {
    if (!selectedFile || kValue === "0") return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("k", kValue);

    try {
      const response = await fetch(`${FIBONACCI_API_URL}/preview_clusters/`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const blob = await response.blob();
        setPreviewUrl(URL.createObjectURL(blob));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const analyzeFibonacci = async () => {
    if (!selectedFile) return;
    setFibLoading(true);
    setFibError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("k", kValue);
    formData.append("b_weight", bWeight);

    try {
      const response = await fetch(`${FIBONACCI_API_URL}/analyze/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt);
      }

      const result = await response.json();
      setFibResult(result.image_base64);
    } catch (e: any) {
      setFibError(e.message || "Analysis failed");
    } finally {
      setFibLoading(false);
    }
  };

  // Debounce Preview
  useEffect(() => {
    if (selectedFile && kValue !== "0") {
      const timer = setTimeout(handleFibonacciPreview, 500);
      return () => clearTimeout(timer);
    }
  }, [kValue]); 
  // removed selectedFile from dep array to avoid re-triggering on file change immediately if kValue persists, 
  // but logically if file changes, we might want to preview if K is set. 
  // However, useAnalysis resets stats on file change anyway.

  return {
    kValue,
    setKValue,
    bWeight,
    setBWeight,
    fibResult,
    fibLoading,
    fibError,
    analyzeFibonacci,
    resetFibonacci,
    setFibResult, // Exposed in case we need to clear it from parent
  };
};
