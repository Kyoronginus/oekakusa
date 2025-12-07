import React from "react";
import { Paintbrush, Flame, Zap } from "lucide-react";
import { StatCard } from "./StatsComponents";

interface StatsOverviewProps {
  xp: number;
  streak: number;
  todaysCommits: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
  xp,
  streak,
  todaysCommits,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        icon={Paintbrush}
        label="Cumulative Commits"
        value={`${xp / 100}`}
        color="blue"
      />

      <StatCard
        icon={Flame}
        label="Current Streak"
        value={`${streak} Days`}
        color="orange"
      />

      <StatCard
        icon={Zap}
        label="Today's Commits"
        value={`${todaysCommits}`}
        color="green"
      />
    </div>
  );
};

export default StatsOverview;
