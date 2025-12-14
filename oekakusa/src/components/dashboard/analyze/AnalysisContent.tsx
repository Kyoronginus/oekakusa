import React from "react";
import { X, Palette, Calculator, ImageIcon } from "lucide-react";
import { AnalysisTab, ColorResult } from "./types";
import FibonacciPanel from "./fibonacci-detection/FibonacciPanel";
import ColorPanel from "./color-analysis/ColorPanel";

interface AnalysisContentProps {
  onClose: () => void;
  activeTab: AnalysisTab;
  setActiveTab: (tab: AnalysisTab) => void;
  selectedFile: File | null;
  previewUrl: string | null;
  lowResPreviewUrl?: string | null;
  loading: boolean;
  error: string | null;

  // Fibonacci Props
  kValue: string;
  setKValue: (val: string) => void;
  bWeight: string;
  setBWeight: (val: string) => void;
  fibResult: string | null;
  analyzeFibonacci: () => void;

  // Color Props
  colorResults: ColorResult | null;
  analyzeColor: () => void;
}

const AnalysisContent: React.FC<AnalysisContentProps> = ({
  onClose,
  activeTab,
  setActiveTab,
  selectedFile,
  previewUrl,
  lowResPreviewUrl,
  loading,
  error,
  kValue,
  setKValue,
  bWeight,
  setBWeight,
  fibResult,
  analyzeFibonacci,
  colorResults,
  analyzeColor,
}) => {
  return (
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
            {/* Preview Area (Shared) */}
            <div className="flex justify-center bg-gray-100 rounded-lg p-4 border relative min-h-[300px] items-center">
              {loading && !previewUrl && !lowResPreviewUrl && (
                <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              )}
              {loading && (previewUrl || lowResPreviewUrl) && (
                <div className="absolute bottom-4 right-4 z-20 bg-white/90 p-2 rounded-full shadow-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
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
                <img
                  src={previewUrl || lowResPreviewUrl || ""}
                  alt="Preview"
                  className={`max-h-[50vh] object-contain shadow-lg transition-all duration-500 ${
                    !previewUrl && lowResPreviewUrl
                      ? "blur-sm scale-95"
                      : "blur-0 scale-100"
                  }`}
                />
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
                Error: {error}
              </div>
            )}

            {/* Controls & Results Panels */}
            {activeTab === "fibonacci" && (
              <FibonacciPanel
                kValue={kValue}
                setKValue={setKValue}
                bWeight={bWeight}
                setBWeight={setBWeight}
                analyzeFibonacci={analyzeFibonacci}
                loading={loading}
              />
            )}

            {activeTab === "color" && (
              <ColorPanel
                colorResults={colorResults}
                analyzeColor={analyzeColor}
                loading={loading}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisContent;
