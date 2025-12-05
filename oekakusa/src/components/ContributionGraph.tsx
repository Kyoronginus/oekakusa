import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';

interface ContributionGraphProps {
  values: { date: string; count: number }[];
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({ values }) => {
  const today = new Date();
  
  // Shift date for better visualization (e.g. show last 3-4 months)
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
            return 'color-empty';
          }
          return `color-scale-${Math.min(value.count, 4)}`;
        }}
        tooltipDataAttrs={(value: any) => {
          return {
            'data-tooltip-id': 'heatmap-tooltip',
            'data-tooltip-content': value.date ? `${value.date}: ${value.count} contributions` : 'No contributions',
          };
        }}
        showWeekdayLabels={true}
      />
      <Tooltip id="heatmap-tooltip" />
      <style>{`
        .react-calendar-heatmap .color-empty { fill: #1f2937; }
        .react-calendar-heatmap .color-scale-1 { fill: #0e4429; }
        .react-calendar-heatmap .color-scale-2 { fill: #006d32; }
        .react-calendar-heatmap .color-scale-3 { fill: #26a641; }
        .react-calendar-heatmap .color-scale-4 { fill: #39d353; }
        .react-calendar-heatmap text { font-size: 10px; fill: #6b7280; }
      `}</style>
    </div>
  );
};

export default ContributionGraph;
