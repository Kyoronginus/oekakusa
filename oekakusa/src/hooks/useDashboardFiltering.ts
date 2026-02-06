import { useState, useMemo } from "react";
import { Commit } from "./useDashboardData";
import { getLocalYYYYMMDD } from "../utils/dateUtils";

export const useDashboardFiltering = (commits: Commit[]) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Compute available years from commits
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear()); // Always include current year
    commits.forEach((c) => {
      years.add(new Date(c.timestamp * 1000).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a); // Descending
  }, [commits]);

  // Derived: Commits for the selected date
  const selectedDateCommits = useMemo(() => {
    if (!selectedDate) return [];
    return commits.filter(
      (c) => getLocalYYYYMMDD(new Date(c.timestamp * 1000)) === selectedDate,
    );
  }, [selectedDate, commits]);

  return {
    selectedYear,
    setSelectedYear,
    selectedDate,
    setSelectedDate,
    availableYears,
    selectedDateCommits,
  };
};
