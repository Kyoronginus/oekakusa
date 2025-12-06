import React from 'react';
import { X, Calendar, Folder } from 'lucide-react';
import { Commit } from '../../hooks/useDashboardData';
import { convertFileSrc } from '@tauri-apps/api/core';

interface CommitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  commit: Commit | null;
  isTauri: boolean;
}

const CommitDetailModal: React.FC<CommitDetailModalProps> = ({ isOpen, onClose, commit, isTauri }) => {
  if (!isOpen || !commit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
        >
          <X size={24} />
        </button>

        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
             <img 
              src={commit.thumbnail_url || (isTauri ? convertFileSrc(commit.thumbnail_path) : "https://placehold.co/800x600?text=Web+View")} 
              alt="Commit Detail" 
              className="max-w-full max-h-[70vh] object-contain shadow-md rounded"
            />
        </div>

        <div className="p-6 bg-white border-t">
          <h2 className="text-2xl font-bold mb-2 text-gray-800 flex items-center gap-2">
             <span className="truncate">{commit.path.split(/[\\/]/).pop()}</span>
          </h2>
          
          <div className="flex flex-wrap gap-6 text-gray-600">
            <div className="flex items-center gap-2">
               <Calendar size={18} className="text-orange-500" />
               <span>{new Date(commit.timestamp * 1000).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
               <Folder size={18} className="text-blue-500" />
               <span className="truncate max-w-md text-sm" title={commit.path}>{commit.path}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitDetailModal;
