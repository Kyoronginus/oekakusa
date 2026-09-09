import { useMemo } from "react";
import { Commit } from "../../../hooks/useDashboardData";

export const useStatisticsData = (commits: Commit[]) => {
  // 1. Hour of Day
  const hourData = useMemo(() => {
    const hours = new Array(24).fill(0);
    commits.forEach((commit) => {
      const date = new Date(commit.timestamp * 1000);
      hours[date.getHours()]++;
    });
    return hours.map((count, hour) => ({
      label: `${hour}`,
      value: count,
      tooltip: `${hour}:00 - ${count} commits`,
    }));
  }, [commits]);

  // 2. Day of Week
  const weekData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = new Array(7).fill(0);
    commits.forEach((commit) => {
      const date = new Date(commit.timestamp * 1000);
      counts[date.getDay()]++;
    });
    return days.map((day, i) => ({
      label: day,
      value: counts[i],
      tooltip: `${day} - ${counts[i]} commits`,
    }));
  }, [commits]);

  // 3. Day of Month
  const monthDayData = useMemo(() => {
    const counts = new Array(31).fill(0);
    commits.forEach((commit) => {
      const date = new Date(commit.timestamp * 1000);
      const day = date.getDate() - 1; // 1-31 -> 0-30
      if (day >= 0 && day < 31) counts[day]++;
    });
    return counts.map((count, i) => ({
      label: `${i + 1}`,
      value: count,
      tooltip: `Day ${i + 1} - ${count} commits`,
    }));
  }, [commits]);

  // 4. Month of Year
  const yearData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const counts = new Array(12).fill(0);
    commits.forEach((commit) => {
      const date = new Date(commit.timestamp * 1000);
      counts[date.getMonth()]++;
    });
    return months.map((month, i) => ({
      label: month,
      value: counts[i],
      tooltip: `${month} - ${counts[i]} commits`,
    }));
  }, [commits]);

  return {
    hourData,
    weekData,
    monthDayData,
    yearData,
  };
};
