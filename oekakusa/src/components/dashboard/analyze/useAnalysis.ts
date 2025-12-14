import { useState, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { readFile } from "@tauri-apps/plugin-fs";
import { Commit } from "../../../hooks/useDashboardData";
import { AnalysisTab } from "./types";
import { useFibonacci } from "./fibonacci-detection/useFibonacci";
import { useColorAnalysis } from "./color-analysis/useColorAnalysis";

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
      // Set low-res preview immediately if available
      if (commit.thumbnail_small_path) {
        setLowResPreviewUrl(
          isTauri
            ? convertFileSrc(commit.thumbnail_small_path)
            : commit.thumbnail_url || null
        );
      } else {
        setLowResPreviewUrl(commit.thumbnail_url || null);
      }

      let file: File;
      let url: string = "";

      if (commit.thumbnail_url) {
        url = commit.thumbnail_url;
        if (isTauri) {
          const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
          const response = await tauriFetch(url);
          const blob = await response.blob();
          file = new File([blob], `commit_${commit.id}.png`, {
            type: blob.type,
          });
        } else {
          const response = await fetch(url);
          const blob = await response.blob();
          file = new File([blob], `commit_${commit.id}.png`, {
            type: blob.type,
          });
        }
      } else if (isTauri && commit.thumbnail_path) {
        const bytes = await readFile(commit.thumbnail_path);
        const blob = new Blob([bytes], { type: "image/png" });
        file = new File([blob], `commit_${commit.id || "local"}.png`, {
          type: "image/png",
        });
        url = convertFileSrc(commit.thumbnail_path);
      } else {
        throw new Error("No valid image source found.");
      }

      setSelectedFile(file);
      setPreviewUrl(url);
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
