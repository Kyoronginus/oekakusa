import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import KanbanItem, { KanbanItemType } from "./KanbanItem";
import { Plus } from "lucide-react";

type Props = {
  id: string; // "todo" | "in-progress" | "done"
  title: string;
  items: KanbanItemType[];
  color?: string; // Header color logic
  count?: number;
  onAddItem?: () => void;
  onEdit?: (item: KanbanItemType) => void;
  onInlineUpdate?: (id: string, newTitle: string) => void;
  onDelete?: (id: string, title: string) => void;
};

const KanbanColumn = ({
  id,
  title,
  items,
  color,
  count,
  onAddItem,
  onEdit,
  onInlineUpdate,
  onDelete,
}: Props) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col h-full min-w-[280px] w-full bg-transparent rounded-xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            color || "bg-gray-100 text-gray-600"
          }`}
        >
          {title}
        </span>
        <span className="text-xs text-gray-400 font-medium">
          {count ?? items.length}
        </span>
        <div className="flex-1" />
        <button
          onClick={onAddItem}
          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Sortable List Area */}
      <div ref={setNodeRef} className="flex-1 p-1">
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <KanbanItem
              key={item.id}
              item={item}
              onEdit={onEdit}
              onInlineUpdate={onInlineUpdate}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {/* 'New Page' placeholder button */}
        <button
          onClick={onAddItem}
          className="w-full flex items-center gap-2 text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm mt-1"
        >
          <Plus size={16} />
          <span>New page</span>
        </button>
      </div>
    </div>
  );
};

export default KanbanColumn;
