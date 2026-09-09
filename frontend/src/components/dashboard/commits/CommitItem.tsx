import { Commit } from "../../../hooks/useDashboardData";
import ProgressiveImage from "../../common/ProgressiveImage";
import { useCommitImage } from "../../../hooks/useCommitImage";

interface CommitItemProps {
  commit: Commit;
  isTauri: boolean;
  onClick: (commit: Commit) => void;
}

const CommitItem = ({ commit, isTauri, onClick }: CommitItemProps) => {
  const { lowResSrc, highResSrc } = useCommitImage(commit, isTauri);

  return (
    <div
      className="bg-gray-50 rounded-lg overflow-hidden group relative cursor-pointer hover:ring-2 hover:ring-primary transition shadow-sm border border-gray-200"
      onClick={() => onClick(commit)}
    >
      <ProgressiveImage
        lowResSrc={lowResSrc}
        highResSrc={highResSrc}
        alt="Thumbnail"
        className="w-full h-32 object-contain bg-gray-100 transform group-hover:scale-105"
        onError={(e: any) => {
          console.error("Image load failed:", commit.path);
          e.currentTarget.src = "https://placehold.co/400x300?text=Broken+Link";
        }}
      />
      <div className="p-2">
        <p
          className="text-xs text-gray-700 truncate font-medium"
          title={commit.path}
        >
          {commit.path.split(/[\\/]/).pop()}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(commit.timestamp * 1000).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

export default CommitItem;
