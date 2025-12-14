import { Upload } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Commit } from "../../../hooks/useDashboardData";
import ProgressiveImage from "../../common/ProgressiveImage";

interface AnalysisSidebarProps {
  commits: Commit[];
  onSelectCommit: (commit: Commit) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isTauri: boolean;
}

const AnalysisSidebar = ({
  commits,
  onSelectCommit,
  onFileChange,
  isTauri,
}: AnalysisSidebarProps) => {
  return (
    <div className="w-1/3 bg-gray-50 border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Upload size={20} /> Select Image
        </h2>
      </div>

      <div className="p-4 border-b bg-white">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-gray-500" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span>
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={onFileChange}
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Or Pick Recent
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {commits.slice(0, 20).map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectCommit(c)}
              className="cursor-pointer group relative aspect-video rounded overflow-hidden border border-gray-200 hover:ring-2 hover:ring-primary"
            >
              <ProgressiveImage
                lowResSrc={
                  c.thumbnail_small_path
                    ? isTauri
                      ? convertFileSrc(c.thumbnail_small_path)
                      : c.thumbnail_url
                    : undefined
                }
                highResSrc={
                  c.thumbnail_url ||
                  (isTauri ? convertFileSrc(c.thumbnail_path) : "")
                }
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                alt="recent"
                onError={(e: any) => (e.currentTarget.style.display = "none")}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisSidebar;
