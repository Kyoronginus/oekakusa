import React from "react";
import { ColorResult } from "../types";

interface ColorPanelProps {
  colorResults: ColorResult | null;
  analyzeColor: () => void;
  loading: boolean;
}

const ColorPanel: React.FC<ColorPanelProps> = ({
  colorResults,
  analyzeColor,
  loading,
}) => {
  return (
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
                item.title === "3D Distribution" ? "col-span-full" : ""
              }`}
            >
              <h4 className="text-sm font-bold text-gray-600 mb-2">
                {item.title}
              </h4>
              <img src={item.img} alt={item.title} className="w-full rounded" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPanel;
