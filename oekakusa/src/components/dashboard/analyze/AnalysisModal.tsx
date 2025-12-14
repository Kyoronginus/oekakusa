import React from "react";
import { Commit } from "../../../hooks/useDashboardData";
import AnalysisSidebar from "./AnalysisSidebar";
import AnalysisContent from "./AnalysisContent";
import { useAnalysis } from "./useAnalysis";

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  commits: Commit[];
  isTauri: boolean;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  commits,
  isTauri,
}) => {
  const {
    activeTab,
    setActiveTab,
    selectedFile,
    previewUrl,
    lowResPreviewUrl,
    loading,
    error,
    handleFileChange,
    selectCommitImage,
    fibonacciValues,
    colorValues,
  } = useAnalysis(isOpen, isTauri);

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
        <AnalysisSidebar
          commits={commits}
          onSelectCommit={selectCommitImage}
          onFileChange={handleFileChange}
          isTauri={isTauri}
        />
        <AnalysisContent
          onClose={onClose}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          lowResPreviewUrl={lowResPreviewUrl}
          loading={
            loading || fibonacciValues.fibLoading || colorValues.colorLoading
          }
          error={error || fibonacciValues.fibError || colorValues.colorError}
          // Fibonacci Props
          kValue={fibonacciValues.kValue}
          setKValue={fibonacciValues.setKValue}
          bWeight={fibonacciValues.bWeight}
          setBWeight={fibonacciValues.setBWeight}
          fibResult={fibonacciValues.fibResult}
          analyzeFibonacci={fibonacciValues.analyzeFibonacci}
          // Color Props
          colorResults={colorValues.colorResults}
          analyzeColor={colorValues.analyzeColor}
        />
      </div>
    </div>
  );
};

export default AnalysisModal;
