import { convertFileSrc } from "@tauri-apps/api/core";
import { Commit } from "../../../hooks/useDashboardData";
import ProgressiveImage from "../../common/ProgressiveImage";
import { useFirebaseImage } from "../../../hooks/useFirebaseImage";

interface SidebarCommitItemProps {
  commit: Commit;
  isTauri: boolean;
  onSelect: (commit: Commit) => void;
}

const SidebarCommitItem = ({
  commit,
  isTauri,
  onSelect,
}: SidebarCommitItemProps) => {
  const { url: remoteLowResUrl } = useFirebaseImage(
    commit.storage_path,
    commit.thumbnail_url
  );

  const lowResSrc = remoteLowResUrl;

  const highResSrc =
    remoteLowResUrl ||
    commit.thumbnail_url ||
    (isTauri ? convertFileSrc(commit.thumbnail_path) : "");

  return (
    <div
      onClick={() => onSelect(commit)}
      className="cursor-pointer group relative aspect-video rounded overflow-hidden border border-gray-200 hover:ring-2 hover:ring-primary"
    >
      <ProgressiveImage
        lowResSrc={lowResSrc}
        highResSrc={highResSrc}
        className="w-full h-full object-contain bg-gray-100 transition-transform duration-300 group-hover:scale-105"
        alt="recent"
        onError={(e: any) => (e.currentTarget.style.display = "none")}
      />
    </div>
  );
};

export default SidebarCommitItem;
