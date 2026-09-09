import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { KanbanItemType } from "../components/dashboard/kanban-boards/KanbanItem";

export const useKanbanData = () => {
  const [items, setItems] = useState<KanbanItemType[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "kanban_items"),
      orderBy("order", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as KanbanItemType[];
      setItems(fetchedItems);
    });

    return () => unsubscribe();
  }, [user]);

  const addItem = async (status: KanbanItemType["status"]) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "users", user.uid, "kanban_items"), {
        title: "New Task",
        status,
        description: "Click to edit description",
        color:
          status === "todo"
            ? "#fecaca"
            : status === "in-progress"
              ? "#bfdbfe"
              : "#bbf7d0",
        timestamp: serverTimestamp(),
        order: items.length, // Append to end
      });
    } catch (error) {
      console.error("Error adding kanban item:", error);
    }
  };

  const updateItemStatus = async (
    id: string,
    newStatus: KanbanItemType["status"],
  ) => {
    if (!user) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus } : item,
      ),
    );

    try {
      const itemRef = doc(db, "users", user.uid, "kanban_items", id);
      await updateDoc(itemRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating kanban item status:", error);
    }
  };

  const updateItem = async (id: string, data: Partial<KanbanItemType>) => {
    if (!user) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item)),
    );

    try {
      const itemRef = doc(db, "users", user.uid, "kanban_items", id);
      await updateDoc(itemRef, data);
    } catch (error) {
      console.error("Error updating kanban item:", error);
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return;
    try {
      const itemRef = doc(db, "users", user.uid, "kanban_items", id);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error("Error deleting kanban item:", error);
    }
  };

  const reorderItems = async (updatedItems: KanbanItemType[]) => {
    // Optimistic Update
    setItems(updatedItems);

    try {
      const updates = updatedItems.map((item, index) => {
        const itemRef = doc(db, "users", user!.uid, "kanban_items", item.id);
        return updateDoc(itemRef, { order: index });
      });
      await Promise.all(updates);
    } catch (error) {
      console.error("Error reordering items:", error);
    }
  };

  return {
    items,
    addItem,
    updateItemStatus,
    updateItem,
    deleteItem,
    reorderItems,
  };
};
