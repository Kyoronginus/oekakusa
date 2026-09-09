import { Paintbrush, Flame, Zap } from "lucide-react";
import { StatCard } from "./StatsComponents";
import { Commit } from "../../../hooks/useDashboardData";
import { getLocalYYYYMMDD } from "../../../utils/dateUtils";

interface StatsOverviewProps {
  xp: number;
  streak: number;
  commits: Commit[];
}

const StatsOverview = ({ xp, streak, commits }: StatsOverviewProps) => {
  const todaysCommits = commits.filter(
    (c) => getLocalYYYYMMDD(new Date(c.timestamp * 1000)) === getLocalYYYYMMDD()
  ).length;

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
