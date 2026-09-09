import { useState, useEffect } from "react";
import { storage } from "../firebase";
import { ref, getDownloadURL } from "firebase/storage";

const RESIZE_SUFFIX = "_500x500"; // Firebase Extension default suffix for 500x500

export const useFirebaseImage = (
  storagePath: string | undefined,
  originalUrl: string | undefined
) => {
  const [url, setUrl] = useState<string | undefined>(originalUrl);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Immediate fallback to original if no storage path (e.g. legacy data)
    if (!storagePath) {
      setUrl(originalUrl);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchResized = async () => {
      // Construct the expected resized path
      // e.g. "folder/image.png" -> "folder/image_500x500.png"
      const lastDotIndex = storagePath.lastIndexOf(".");
      if (lastDotIndex === -1) {
        // No extension?
        setUrl(originalUrl);
        setLoading(false);
        return;
      }

      const pathWithoutExt = storagePath.substring(0, lastDotIndex);
      const ext = storagePath.substring(lastDotIndex);
      const resizedPath = `${pathWithoutExt}${RESIZE_SUFFIX}${ext}`;
      console.log(`[useFirebaseImage] Attempting to fetch: ${resizedPath}`);

      try {
        const resizedRef = ref(storage, resizedPath);
        const downloadUrl = await getDownloadURL(resizedRef);
        if (isMounted) {
          console.log(
            `[useFirebaseImage] Success! Got 500x500 URL: ${downloadUrl}`
          );
          setUrl(downloadUrl);
        }
      } catch (e) {
        console.warn(
          `[useFirebaseImage] Failed to fetch 500x500 for ${resizedPath}, falling back to original.`,
          e
        );
        // Fallback to original
        if (isMounted) {
          setUrl(originalUrl);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchResized();

    return () => {
      isMounted = false;
    };
  }, [storagePath, originalUrl]);

  return { url, loading };
};
