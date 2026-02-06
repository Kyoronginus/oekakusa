import { useState } from "react";

export const useTauri = () => {
  const [isTauri] = useState(() => {
    // @ts-ignore
    return !!(window.__TAURI__ || window.__TAURI_INTERNALS__);
  });

  return isTauri;
};
