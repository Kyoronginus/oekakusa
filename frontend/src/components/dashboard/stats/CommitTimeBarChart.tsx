import { useMemo } from "react";
import { Commit } from "../../../hooks/useDashboardData";
import { Tooltip } from "react-tooltip";

interface CommitTimeBarChartProps {
  commits: Commit[];
}

const CommitTimeBarChart = ({ commits }: CommitTimeBarChartProps) => {
  const data = useMemo(() => {
    const hours = new Array(24).fill(0);
    commits.forEach((commit) => {
      const date = new Date(commit.timestamp * 1000);
      const hour = date.getHours();
      hours[hour]++;
    });
    return hours.map((count, hour) => ({ hour, count }));
  }, [commits]);

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const height = 200;
  const width = 600;
  const padding = 40;
  const barWidth = (width - padding * 2) / 24;

  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h3 className="text-lg font-bold mb-4 text-gray-800">
        Commit Time Distribution
      </h3>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ minWidth: "600px" }}
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
            const barHeight = (d.count / maxCount) * (height - padding * 2);
            const x = padding + i * barWidth;
            const y = height - padding - barHeight;

            return (
              <g
                key={i}
                data-tooltip-id="chart-tooltip"
                data-tooltip-content={`${d.hour}:00 - ${d.count} commits`}
              >
                <rect
                  x={x + 2}
                  y={y}
                  width={barWidth - 4}
                  height={barHeight}
                  fill="#f6c05cff"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  rx="4"
                />
                {/* X Axis Labels (every 3 hours) */}
                {i % 3 === 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#afaa9cff"
                  >
                    {d.hour}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <Tooltip id="chart-tooltip" />
    </div>
  );
};

export default CommitTimeBarChart;
