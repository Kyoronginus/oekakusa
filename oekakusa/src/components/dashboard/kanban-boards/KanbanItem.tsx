import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, MoreHorizontal, Edit2 } from "lucide-react";

export type KanbanItemType = {
  id: string;
  title: string;
  description?: string;
  color?: string; // e.g., "bg-red-100" or hex
  order?: number;
  status: "todo" | "in-progress" | "done";
};

type Props = {
  item: KanbanItemType;
  onEdit?: (item: KanbanItemType) => void;
  onDelete?: (id: string, title: string) => void;
};

const KanbanItem = ({ item, onEdit, onDelete }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, // Make it ghost-like if dragging
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-2 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group relative ${
        item.color ? `border-l-4` : ""
      }`}
      onClick={() => {
        if (onEdit) onEdit(item);
      }}
      // If we use border-l-4, we might want to apply the color style dynamically
      // style={{ ...style, borderLeftColor: item.color }} if hex
    >
      <div className="flex items-center gap-2 mb-1">
        <FileText size={16} className="text-gray-500" />
        <span className="font-medium text-gray-700 text-sm flex-1 truncate">
          {item.title}
        </span>
        <button
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (onEdit) onEdit(item);
          }}
        >
          <Edit2 size={12} />
        </button>
        <button
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (onDelete) onDelete(item.id, item.title);
          }}
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Optional: Indicator line color if provided */}
      {item.color && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ backgroundColor: item.color }}
        />
      )}
    </div>
  );
};

export default KanbanItem;
