import React, { useState, useEffect } from "react";
import { X, Upload, Palette, Calculator, ImageIcon } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { readFile } from "@tauri-apps/plugin-fs";
import { Commit } from "../../hooks/useDashboardData";

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  commits: Commit[];
  isTauri: boolean;
}

const FIBONACCI_API_URL = import.meta.env.VITE_FIBONACCI_API_URL;
const COLOR_API_URL = import.meta.env.VITE_COLOR_API_URL;

const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  commits,
  isTauri,
}) => {
  useEffect(() => {
    console.log("Analysis APIs:", {
      fib: FIBONACCI_API_URL,
      col: COLOR_API_URL,
    });
  }, []);

  const [activeTab, setActiveTab] = useState<"fibonacci" | "color">(
    "fibonacci"
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fibonacci State
  const [kValue, setKValue] = useState("0");
  const [bWeight, setBWeight] = useState("1000");
  const [fibResult, setFibResult] = useState<string | null>(null);

  // Color State
  const [colorResults, setColorResults] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setSelectedFile(null);
      setPreviewUrl(null);
      setFibResult(null);
      setColorResults(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Reset results
      setFibResult(null);
      setColorResults(null);
      setError(null);
    }
  };

  // Helper to convert existing Commit thumbnail URL/Path to a File object if possible
  const selectCommitImage = async (commit: Commit) => {
    try {
      setLoading(true);
      let file: File;
      let url: string = "";

      if (commit.thumbnail_url) {
        // Firebase URL - Fetch using Tauri HTTP to bypass CORS
        url = commit.thumbnail_url;
        if (isTauri) {
          const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
          const response = await tauriFetch(url);
          const blob = await response.blob();
          file = new File([blob], `commit_${commit.id}.png`, {
            type: blob.type,
          });
        } else {
          // Web fallback (might still CORS if not configured, but standard fetch)
          const response = await fetch(url);
          const blob = await response.blob();
          file = new File([blob], `commit_${commit.id}.png`, {
            type: blob.type,
          });
        }
      } else if (isTauri && commit.thumbnail_path) {
        // Local File (Tauri) - Use readFile
        const bytes = await readFile(commit.thumbnail_path);
        // Determine type? Defaulting to png/image
        const blob = new Blob([bytes], { type: "image/png" });
        file = new File([blob], `commit_${commit.id || "local"}.png`, {
          type: "image/png",
        });
        // For preview, use convertFileSrc
        url = convertFileSrc(commit.thumbnail_path);
      } else {
        throw new Error("No valid image source found.");
      }

      setSelectedFile(file);
      setPreviewUrl(url); // Use original URL for preview
      setFibResult(null);
      setColorResults(null);
      setError(null);
    } catch (e) {
      console.error("Failed to load commit image", e);
      setError("Failed to load image from commit. Ensure file exists.");
    } finally {
      setLoading(false);
    }
  };

  const handleFibonacciPreview = async () => {
    if (!selectedFile || kValue === "0") return;

    // Simple debounce logic could act here, but for now direct call
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
        setPreviewUrl(URL.createObjectURL(blob)); // Update preview with cluster preview
      }
    } catch (e) {
      console.error(e);
    }
  };

  const analyzeFibonacci = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
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
      setFibResult(result.image_base64); // Base64 string
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const analyzeColor = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
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
      setError(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce Preview for K value changes in Fib mode
    if (activeTab === "fibonacci" && selectedFile && kValue !== "0") {
      const timer = setTimeout(handleFibonacciPreview, 500);
      return () => clearTimeout(timer);
    }
  }, [kValue, activeTab]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Sidebar - Selection */}
        <div className="w-1/3 bg-gray-50 border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Upload size={20} /> Select Image
            </h2>
          </div>

          <div className="p-4 border-b bg-white">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span>
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Or Pick Recent
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {commits.slice(0, 20).map((c) => (
                <div
                  key={c.id}
                  onClick={() => selectCommitImage(c)}
                  className="cursor-pointer group relative aspect-video rounded overflow-hidden border border-gray-200 hover:ring-2 hover:ring-primary"
                >
                  <img
                    src={
                      c.thumbnail_url ||
                      (isTauri ? convertFileSrc(c.thumbnail_path) : "")
                    }
                    className="w-full h-full object-cover"
                    alt="recent"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content - Analysis */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("fibonacci")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition ${
                  activeTab === "fibonacci"
                    ? "bg-orange-100 text-orange-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Calculator size={18} /> Fibonacci Spiral
              </button>
              <button
                onClick={() => setActiveTab("color")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition ${
                  activeTab === "color"
                    ? "bg-green-100 text-green-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Palette size={18} /> Color Analysis
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
            {!selectedFile ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ImageIcon size={64} className="mb-4 opacity-50" />
                <p>Select an image to start analysis</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Preview Area */}
                <div className="flex justify-center bg-gray-100 rounded-lg p-4 border relative min-h-[300px] items-center">
                  {loading && (
                    <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                  )}

                  {/* Result Overlay or Preview */}
                  {activeTab === "fibonacci" && fibResult ? (
                    <img
                      src={
                        fibResult.startsWith("data:")
                          ? fibResult
                          : `data:image/png;base64,${fibResult}`
                      }
                      alt="Result"
                      className="max-h-[50vh] object-contain shadow-lg"
                    />
                  ) : (
                    activeTab === "fibonacci" && (
                      <img
                        src={previewUrl || ""}
                        alt="Preview"
                        className="max-h-[50vh] object-contain shadow-lg"
                      />
                    )
                  )}

                  {activeTab === "color" && (
                    <img
                      src={previewUrl || ""}
                      alt="Preview"
                      className="max-h-[50vh] object-contain shadow-lg"
                    />
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
                    Error: {error}
                  </div>
                )}

                {/* Controls & Results */}
                {activeTab === "fibonacci" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          K Value (Clusters): {kValue === "0" ? "Auto" : kValue}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={kValue}
                          onChange={(e) => setKValue(e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Background Weight:{" "}
                          {parseInt(bWeight) < 500
                            ? "None"
                            : parseInt(bWeight) > 15000
                            ? "Very High"
                            : "Medium"}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20000"
                          step="100"
                          value={bWeight}
                          onChange={(e) => setBWeight(e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                    <button
                      onClick={analyzeFibonacci}
                      disabled={loading}
                      className="w-full py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition shadow-lg"
                    >
                      Detect Golden Spiral
                    </button>
                  </div>
                )}

                {activeTab === "color" && (
                  <div className="space-y-6">
                    {!colorResults ? (
                      <button
                        onClick={analyzeColor}
                        disabled={loading}
                        className="w-full py-3 bg-teal-500 text-white rounded-lg font-bold hover:bg-teal-600 transition shadow-lg"
                      >
                        Analyze Colors
                      </button>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            title: "Color Distribution",
                            img: colorResults.color_distribution,
                          },
                          {
                            title: "Hue Wheel",
                            img: colorResults.hue_distribution,
                          },
                          {
                            title: "Brightness",
                            img: colorResults.brightness_distribution,
                          },
                          {
                            title: "Saturation",
                            img: colorResults.saturation_distribution,
                          },
                          {
                            title: "3D Distribution",
                            img: colorResults.histogram_3d,
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className={`bg-gray-50 p-2 rounded border ${
                              item.title === "3D Distribution"
                                ? "col-span-full"
                                : ""
                            }`}
                          >
                            <h4 className="text-sm font-bold text-gray-600 mb-2">
                              {item.title}
                            </h4>
                            <img
                              src={item.img}
                              alt={item.title}
                              className="w-full rounded"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
