import { Tooltip } from "react-tooltip";

interface ChartDataPoint {
  label: string;
  value: number;
  tooltip: string;
}

interface GenericBarChartProps {
  data: ChartDataPoint[];
  title: string;
  height?: number;
  color?: string;
  labelInterval?: number;
}

const GenericBarChart = ({
  data,
  title,
  height = 200,
  color = "#f6c05cff",
  labelInterval = 1,
}: GenericBarChartProps) => {
  const maxCount = Math.max(...data.map((d) => d.value), 1);
  const width = 600;
  const padding = 40;
  const barWidth = (width - padding * 2) / data.length;

  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-full flex flex-col">
      <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>
      <div className="w-full overflow-x-auto flex-1 flex items-end">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ minWidth: "100%" }}
          preserveAspectRatio="none"
        >
          {/* Y Axis Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + (height - padding * 2) * (1 - ratio);
            return (
              <line
                key={ratio}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#eee"
                strokeWidth="1"
              />
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = (d.value / maxCount) * (height - padding * 2);
            const x = padding + i * barWidth;
            const y = height - padding - barHeight;

            return (
              <g
                key={i}
                data-tooltip-id={`chart-tooltip-${title}`}
                data-tooltip-content={d.tooltip}
              >
                <rect
                  x={x + 2}
                  y={y}
                  width={Math.max(barWidth - 4, 2)}
                  height={Math.max(barHeight, 0)} // Ensure positive height
                  fill={d.value > 0 ? color : "#f0f0f0"}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  rx="4"
                />
                {/* X Axis Labels */}
                {i % labelInterval === 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#afaa9cff"
                  >
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <Tooltip id={`chart-tooltip-${title}`} />
    </div>
  );
};

export default GenericBarChart;
