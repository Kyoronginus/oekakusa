import React from "react";

interface FibonacciPanelProps {
  kValue: string;
  setKValue: (val: string) => void;
  bWeight: string;
  setBWeight: (val: string) => void;
  analyzeFibonacci: () => void;
  loading: boolean;
}

const FibonacciPanel: React.FC<FibonacciPanelProps> = ({
  kValue,
  setKValue,
  bWeight,
  setBWeight,
  analyzeFibonacci,
  loading,
}) => {
  return (
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
            Golden ratio weight:{" "}
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
        Run
      </button>
    </div>
  );
};

export default FibonacciPanel;
