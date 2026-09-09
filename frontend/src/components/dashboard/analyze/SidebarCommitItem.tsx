import { Commit } from "../../../hooks/useDashboardData";
import ProgressiveImage from "../../common/ProgressiveImage";
import { useCommitImage } from "../../../hooks/useCommitImage";

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
  const { lowResSrc, highResSrc } = useCommitImage(commit, isTauri);

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
