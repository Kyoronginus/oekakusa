import { convertFileSrc } from "@tauri-apps/api/core";
import { Commit } from "./useDashboardData";
import { useFirebaseImage } from "./useFirebaseImage";

export const useCommitImage = (commit: Commit, isTauri: boolean) => {
  const { url: remoteLowResUrl, loading } = useFirebaseImage(
    commit.storage_path,
    commit.thumbnail_url
  );

  // Always prefer the remote low-res (500x500) URL for previews
  const lowResSrc = remoteLowResUrl;

  // High-res fallback chain:
  // 1. Remote resized (if available, it's pretty good for many views)
  // 2. Remote original
  // 3. Local thumbnail path (if in Tauri)
  // 4. Placeholder
  const highResSrc =
    remoteLowResUrl ||
    commit.thumbnail_url ||
    (isTauri
      ? convertFileSrc(commit.thumbnail_path)
      : "https://placehold.co/400x300?text=Web+View");

  return { lowResSrc, highResSrc, loading };
};
