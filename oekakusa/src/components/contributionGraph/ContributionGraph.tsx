import React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip } from "react-tooltip";

interface ContributionGraphProps {
  values: { date: string; count: number }[];
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({ values }) => {
  const today = new Date();

  const shiftDate = (date: Date, numDays: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + numDays);
    return newDate;
  };

  return (
    <div>
      <CalendarHeatmap
        startDate={shiftDate(today, -150)}
        endDate={today}
        values={values}
        classForValue={(value) => {
          if (!value) {
            return "color-empty";
          }
          return `color-scale-${Math.min(value.count, 4)}`;
        }}
        tooltipDataAttrs={(value: any) => {
          return {
            "data-tooltip-id": "heatmap-tooltip",
            "data-tooltip-content": value.date
              ? `${value.date}: ${value.count} contributions`
              : "No contributions",
          } as any;
        }}
        showWeekdayLabels={true}
        gutterSize={2}
      />
      <Tooltip id="heatmap-tooltip" />

      <style>{`
        .react-calendar-heatmap rect {
          rx: 3px; 
          ry: 3px; 
          shape-rendering: geometricPrecision; 
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
