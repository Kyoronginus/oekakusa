import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: "blue" | "orange" | "green";
}

export const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: StatCardProps) => {
  const colorStyles = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    orange: { bg: "bg-orange-100", text: "text-orange-600" },
    green: { bg: "bg-green-100", text: "text-green-600" },
  };

  const { bg, text } = colorStyles[color];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4 border border-gray-100">
      <div className={`p-3 ${bg} rounded-full`}>
        <Icon className={text} size={24} />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};
