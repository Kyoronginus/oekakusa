import { useState, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { readFile } from "@tauri-apps/plugin-fs";
import { Commit } from "../../../hooks/useDashboardData";
import { AnalysisTab } from "./types";
import { useFibonacci } from "./fibonacci-detection/useFibonacci";
import { useColorAnalysis } from "./color-analysis/useColorAnalysis";
import { storage } from "../../../firebase";
import { ref, getDownloadURL } from "firebase/storage";

const RESIZE_SUFFIX = "_500x500";

export const useAnalysis = (isOpen: boolean, isTauri: boolean) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>("fibonacci");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lowResPreviewUrl, setLowResPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Global loading for file selection
  const [error, setError] = useState<string | null>(null); // Global error

  // Sub-hooks
  const fibonacciValues = useFibonacci(selectedFile, setPreviewUrl);
  const colorValues = useColorAnalysis(selectedFile);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setLowResPreviewUrl(null);
    setError(null);
    setLoading(false);
    fibonacciValues.resetFibonacci();
    colorValues.resetColor();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setLowResPreviewUrl(null);
      setError(null);
      // Reset sub-results
      fibonacciValues.setFibResult(null);
      colorValues.setColorResults(null);
    }
  };

  const selectCommitImage = async (commit: Commit) => {
    try {
      setLoading(true);

      let finalUrl = "";
      if (commit.storage_path) {
        // Try to get resized URL first
        try {
          const lastDotIndex = commit.storage_path.lastIndexOf(".");
          if (lastDotIndex !== -1) {
            const pathWithoutExt = commit.storage_path.substring(
              0,
              lastDotIndex
            );
            const ext = commit.storage_path.substring(lastDotIndex);
            const resizedPath = `${pathWithoutExt}${RESIZE_SUFFIX}${ext}`;
            finalUrl = await getDownloadURL(ref(storage, resizedPath));
            console.log("Using resized image for analysis:", finalUrl);
          }
        } catch (e) {
          console.warn("Resized image fetch failed, falling back:", e);
        }
      }

      // Fallback logic
      if (!finalUrl) {
        finalUrl = commit.thumbnail_url || "";
      }

      // Update Preview URL immediately with remote URL (resized or original)
      setLowResPreviewUrl(finalUrl);

      let file: File;

      if (finalUrl) {
        // Remote (Resized or Original)
        if (isTauri) {
          const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
          const response = await tauriFetch(finalUrl);
          const blob = await response.blob();
          file = new File([blob], `commit_${commit.id}.png`, {
            type: blob.type,
          });
        } else {
          const response = await fetch(finalUrl);
          const blob = await response.blob();
          file = new File([blob], `commit_${commit.id}.png`, {
            type: blob.type,
          });
        }
        setPreviewUrl(finalUrl);
      } else if (isTauri && commit.thumbnail_path) {
        // Local File Only fallback (if somehow no remote url exists at all)
        const bytesToRead = await readFile(commit.thumbnail_path);
        const blob = new Blob([bytesToRead], { type: "image/png" });
        file = new File([blob], `commit_${commit.id || "local"}.png`, {
          type: "image/png",
        });
        setPreviewUrl(convertFileSrc(commit.thumbnail_path));
      } else {
        throw new Error("No valid image source found.");
      }

      setSelectedFile(file);
      setError(null);
      fibonacciValues.setFibResult(null);
      colorValues.setColorResults(null);
    } catch (e: any) {
      console.error("Failed to load commit image", e);
      setError("Failed to load image from commit. Ensure file exists.");
    } finally {
      setLoading(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    selectedFile,
    previewUrl,
    lowResPreviewUrl, // Expose this
    loading,
    error,
    handleFileChange,
    selectCommitImage,
    fibonacciValues,
    colorValues,
  };
};
