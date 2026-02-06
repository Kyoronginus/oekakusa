import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (dontShowAgain: boolean) => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  showDontShowAgain?: boolean;
};

const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  showDontShowAgain = false,
}: Props) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative animate-scale-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          {isDestructive && (
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
              <AlertTriangle size={24} />
            </div>
          )}
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
        </div>

        {showDontShowAgain && (
          <div className="flex items-center gap-2 mb-4 justify-center">
            <input
              type="checkbox"
              id="dontShow"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="dontShow"
              className="text-sm text-gray-600 select-none"
            >
              Don't show me this again
            </label>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => onConfirm(dontShowAgain)}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition font-medium shadow-sm ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
