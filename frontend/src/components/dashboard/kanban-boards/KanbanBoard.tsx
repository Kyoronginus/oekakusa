import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import KanbanColumn from "./KanbanColumn";
import KanbanItem, { KanbanItemType } from "./KanbanItem";
import EditItemModal from "./EditItemModal";
import ConfirmModal from "./ConfirmModal";

import { useKanbanData } from "../../../hooks/useKanbanData";
import { useUserSettings } from "../../../hooks/useUserSettings";

const KanbanBoard = () => {
  const {
    items,
    addItem,
    updateItemStatus,
    updateItem,
    deleteItem,
    reorderItems,
  } = useKanbanData();
  const { settings, updateSettings } = useUserSettings();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<KanbanItemType | null>(null);
  const [deletingItem, setDeletingItem] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const getItemsByStatus = (status: KanbanItemType["status"]) =>
    items.filter((item: KanbanItemType) => item.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the containers
    const activeItem = items.find((i: KanbanItemType) => i.id === activeId);
    if (!activeItem) return;

    // If over a container (column) directly
    if (overId === "todo" || overId === "in-progress" || overId === "done") {
      // We might want to handle empty columns here?
      // For now, standard behavior is fine.
      return;
    }

    // Identify if items are in different lists
    const overItem = items.find((i) => i.id === overId);

    if (!overItem) return;

    // If different status, we can conceptually move it to the new list UI-wise
    if (activeItem.status !== overItem.status) {
      // dnd-kit's sortable strategy handles visual sorting if we pass the right items prop to columns.
      // But since we chunk items by status, we might need to update the active item's status locally
      // to see it "snap" into the new list during drag.
      // For simple kanban, often we just wait for drop.
      // However, user complained about ordering.
      // To support robust reordering across columns, we need to be careful.
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      return;
    }

    // We only care about Status changes on Drop
    const activeId = active.id as string;
    const overId = over.id as string;

    const activeItem = items.find((i: KanbanItemType) => i.id === activeId);
    if (!activeItem) {
      setActiveId(null);
      return;
    }

    // 1. Dropped on a Column (Empty area)
    if (overId === "todo" || overId === "in-progress" || overId === "done") {
      if (activeItem.status !== overId) {
        updateItemStatus(activeId, overId);
      }
      // If same column, do nothing (appended to end technically, but we leave order as is)
    }
    // 2. Dropped on another Item
    else {
      const overItem = items.find((i: KanbanItemType) => i.id === overId);
      if (overItem) {
        const activeIndex = items.findIndex((i) => i.id === activeId);
        const overIndex = items.findIndex((i) => i.id === overId);

        if (activeItem.status !== overItem.status) {
          // Status change + potential reorder
          // For simplicity, just switch status first.
          // Refined: Update status AND order.
          // But updateItemStatus only takes ID.
          // Let's just update status for now.
          updateItemStatus(activeId, overItem.status);
          // We could try to insert it at specific index, but useKanbanData logic is simple.
        } else if (activeIndex !== overIndex) {
          // Same column, reorder
          const reordered = arrayMove(items, activeIndex, overIndex);
          // We need to pass the FULL list to reorderItems?
          // Or just the relevant slice? reorderItems in hook updates ALL items passed.
          // So we should pass the reordered full list.
          reorderItems(reordered);
        }
      }
    }

    setActiveId(null);
  };

  const handleAddItem = (status: KanbanItemType["status"]) => {
    addItem(status);
  };

  const handleDeleteItem = (id: string, title: string) => {
    if (settings.confirmKanbanDelete) {
      setDeletingItem({ id, title });
    } else {
      deleteItem(id);
    }
  };

  const confirmDelete = async (dontShowAgain: boolean) => {
    if (deletingItem) {
      await deleteItem(deletingItem.id);

      if (dontShowAgain) {
        await updateSettings({ confirmKanbanDelete: false });
      }

      setDeletingItem(null);
    }
  };

  const handleEditItem = (item: KanbanItemType) => {
    setEditingItem(item);
  };

  const handleSaveEdit = async (
    id: string,
    updates: Partial<KanbanItemType>,
  ) => {
    await updateItem(id, updates);
    setEditingItem(null);
  };

  const handleInlineUpdate = async (id: string, newTitle: string) => {
    await updateItem(id, { title: newTitle });
  };

  const activeItem = activeId
    ? items.find((i: KanbanItemType) => i.id === activeId)
    : null;

  return (
    <div className="py-4">
      {/* Board Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex overflow-x-auto h-full w-full gap-6 pb-4 items-start">
          <KanbanColumn
            id="todo"
            title="To-do"
            items={getItemsByStatus("todo")}
            color="bg-red-50 text-red-700"
            onAddItem={() => handleAddItem("todo")}
            onEdit={handleEditItem}
            onInlineUpdate={handleInlineUpdate}
            onDelete={handleDeleteItem}
          />
          <KanbanColumn
            id="in-progress"
            title="In progress"
            items={getItemsByStatus("in-progress")}
            color="bg-blue-50 text-blue-700"
            onAddItem={() => handleAddItem("in-progress")}
            onEdit={handleEditItem}
            onInlineUpdate={handleInlineUpdate}
            onDelete={handleDeleteItem}
          />
          <KanbanColumn
            id="done"
            title="Complete"
            items={getItemsByStatus("done")}
            color="bg-green-50 text-green-700"
            onAddItem={() => handleAddItem("done")}
            onEdit={handleEditItem}
            onInlineUpdate={handleInlineUpdate}
            onDelete={handleDeleteItem}
          />
        </div>

        <DragOverlay>
          {activeItem ? <KanbanItem item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>

      {editingItem && (
        <EditItemModal
          item={editingItem}
          isOpen={true}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deletingItem && (
        <ConfirmModal
          isOpen={true}
          title="Delete Task"
          message={`Are you sure you want to delete "${deletingItem.title}"? This action cannot be undone.`}
          isDestructive={true}
          showDontShowAgain={true}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeletingItem(null)}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
