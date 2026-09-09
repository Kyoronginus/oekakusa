import { useMemo } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip } from "react-tooltip";

interface ContributionGraphProps {
  values: { date: string; count: number }[];
  year: number;
  onDayClick: (date: string) => void;
}

const ContributionGraph = ({
  values,
  year,
  onDayClick,
}: ContributionGraphProps) => {
  const { startDate, endDate } = useMemo(() => {
    return {
      startDate: new Date(`${year}-01-01`),
      endDate: new Date(`${year}-12-31`),
    };
  }, [year]);

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[800px]">
          <CalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={values}
            classForValue={(value) => {
              if (!value) {
                return "color-empty";
              }
              return `color-scale-${Math.min(value.count, 4)}`;
            }}
            tooltipDataAttrs={(value: any) => {
              if (!value || !value.date) {
                return null;
              }
              return {
                "data-tooltip-id": "heatmap-tooltip",
                "data-tooltip-content": `${new Date(
                  value.date
                ).toLocaleDateString()}: ${value.count} contributions`,
              } as any;
            }}
            showWeekdayLabels={true}
            gutterSize={2}
            onClick={(value) => {
              if (value && value.date) {
                onDayClick(value.date);
              }
            }}
          />
        </div>
      </div>
      <Tooltip id="heatmap-tooltip" />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1; 
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db; 
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9ca3af; 
        }

        .react-calendar-heatmap rect {
          rx: 3px; 
          ry: 3px; 
          shape-rendering: geometricPrecision;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .react-calendar-heatmap rect:hover {
            opacity: 0.8;
            stroke: #00000020;
            stroke-width: 1px;
        }

        .react-calendar-heatmap .color-empty { fill: #d2dae7ff; } 
        .react-calendar-heatmap .color-scale-1 { fill: #ffccbc; }
        .react-calendar-heatmap .color-scale-2 { fill: #ffab91; }
        .react-calendar-heatmap .color-scale-3 { fill: #ff8a65; }
        .react-calendar-heatmap .color-scale-4 { fill: #ff7f50; }
        .react-calendar-heatmap text { font-size: 10px; fill: #9ca3af; }
      `}</style>
    </div>
  );
};

export default ContributionGraph;
