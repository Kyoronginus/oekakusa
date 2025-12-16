import { convertFileSrc } from "@tauri-apps/api/core";
import { Commit } from "../../../hooks/useDashboardData";
import ProgressiveImage from "../../common/ProgressiveImage";
import { useFirebaseImage } from "../../../hooks/useFirebaseImage";

interface CommitItemProps {
  commit: Commit;
  isTauri: boolean;
  onClick: (commit: Commit) => void;
}

const CommitItem = ({ commit, isTauri, onClick }: CommitItemProps) => {
  // Try to get low-res URL from Firebase storage path
  const { url: remoteLowResUrl } = useFirebaseImage(
    commit.storage_path,
    commit.thumbnail_url
  );

  // Always use the remote resized URL for the dashboard preview
  const lowResSrc = remoteLowResUrl;

  const highResSrc =
    remoteLowResUrl ||
    commit.thumbnail_url ||
    (isTauri
      ? convertFileSrc(commit.thumbnail_path)
      : "https://placehold.co/400x300?text=Web+View");

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
