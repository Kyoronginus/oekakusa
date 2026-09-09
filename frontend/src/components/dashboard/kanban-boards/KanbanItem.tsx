import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, MoreHorizontal, Edit2, Trash2 } from "lucide-react";

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
  onInlineUpdate?: (id: string, newTitle: string) => void;
  onDelete?: (id: string, title: string) => void;
};

const KanbanItem = ({ item, onEdit, onInlineUpdate, onDelete }: Props) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempTitle, setTempTitle] = useState(item.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isRenaming });

  useEffect(() => {
    setTempTitle(item.title);
  }, [item.title]);

  const handleSaveRename = () => {
    setIsRenaming(false);
    if (tempTitle.trim() !== "" && tempTitle !== item.title) {
      if (onInlineUpdate) {
        onInlineUpdate(item.id, tempTitle);
      }
    } else {
      setTempTitle(item.title); // Revert if empty or unchanged
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveRename();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setTempTitle(item.title);
    } else if (e.key === " ") {
      e.stopPropagation(); // Allow spaces
    }
  };

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
        if (!isRenaming && onEdit) {
          onEdit(item);
        }
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <FileText size={16} className="text-gray-500" />

        {isRenaming ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            autoFocus
            className="flex-1 text-sm font-medium text-gray-700 border-b border-blue-500 outline-none p-0 bg-transparent"
          />
        ) : (
          <span className="font-medium text-gray-700 text-sm flex-1 break-words">
            {item.title}
          </span>
        )}

        {/* Rename Button (Inline) */}
        {!isRenaming && (
          <button
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
            }}
            title="Rename"
          >
            <Edit2 size={12} />
          </button>
        )}

        {/* Detail Edit Button*/}
        <button
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (onEdit) onEdit(item);
          }}
          title="Edit Details"
        >
          <MoreHorizontal size={14} />
        </button>

        {/* Delete Button (Trash) */}
        <button
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (onDelete) onDelete(item.id, item.title);
          }}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/*Indicator line color if provided */}
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
