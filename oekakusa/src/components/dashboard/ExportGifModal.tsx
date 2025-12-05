import React, { useState } from 'react';
import { Film } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Commit } from '../../hooks/useDashboardData';
import { invoke } from '@tauri-apps/api/core';

interface ExportGifModalProps {
  isOpen: boolean;
  onClose: () => void;
  commits: Commit[];
  isTauri: boolean;
}

const ExportGifModal: React.FC<ExportGifModalProps> = ({ isOpen, onClose, commits, isTauri }) => {
  const [exportingPath, setExportingPath] = useState<string | null>(null);

  // Group commits by file path
  const projects = React.useMemo(() => {
    const map = new Map<string, { name: string, path: string, commits: Commit[] }>();
    commits.forEach(c => {
      if (!map.has(c.path)) {
        map.set(c.path, {
          path: c.path,
          name: c.path.split(/[\\/]/).pop() || "Untitled",
          commits: []
        });
      }
      map.get(c.path)!.commits.push(c);
    });
    return Array.from(map.values());
  }, [commits]);

  if (!isOpen) return null;

  const handleExportGif = async (commitsToExport: Commit[], projectPath: string) => {
    if (exportingPath) return; // Prevent multiple clicks
    setExportingPath(projectPath);
    
    try {
      if (!isTauri) {
        alert("GIF Export is only available in Tauri desktop app.");
        return;
      }
      
      const imagePaths = [...commitsToExport]
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(c => c.thumbnail_path);

      if (imagePaths.length === 0) {
        alert("No commits to export!");
        return;
      }

      console.log(`Exporting GIF for ${projectPath} with ${imagePaths.length} frames.`);
      const result = await invoke('export_gif', { imagePaths });
      alert(`GIF Exported Successfully to:\n${result}`);
      onClose();
    } catch (error) {
      console.error(error);
      alert(`Failed to export GIF: ${error}`);
    } finally {
      setExportingPath(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Film className="text-purple-400" /> Export GIF Timelapse
          </h2>
          <button 
            onClick={() => !exportingPath && onClose()}
            className="text-gray-400 hover:text-white text-2xl leading-none disabled:opacity-50"
            disabled={!!exportingPath}
          >
            &times;
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <p className="text-gray-300 mb-4">Select an illustration project to generate a timelapse GIF:</p>
          
          <div className="grid grid-cols-1 gap-4">
            {projects.map((proj) => {
              const sorted = [...proj.commits].sort((a,b) => b.timestamp - a.timestamp);
              const latest = sorted[0];
              const isExportingThis = exportingPath === proj.path;
              const isExportingOther = !!exportingPath && !isExportingThis;

              return (
                <div key={proj.path} className={`bg-gray-700 p-4 rounded-lg flex items-center gap-4 transition-colors ${isExportingOther ? 'opacity-50' : 'hover:bg-gray-650'}`}>
                   <div className="w-20 h-20 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={latest.thumbnail_url || (isTauri ? convertFileSrc(latest.thumbnail_path) : "https://placehold.co/100")} 
                        className="w-full h-full object-cover"
                        alt={proj.name}
                      />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate" title={proj.path}>{proj.name}</h3>
                      <p className="text-sm text-gray-400">{proj.commits.length} snapshots</p>
                      <p className="text-xs text-gray-500">Last update: {new Date(latest.timestamp * 1000).toLocaleDateString()}</p>
                   </div>
                   <button
                     onClick={() => handleExportGif(proj.commits, proj.path)}
                     disabled={!!exportingPath}
                     className={`px-4 py-2 rounded-lg font-medium shadow-lg whitespace-nowrap flex items-center gap-2
                       ${isExportingThis ? 'bg-purple-500 cursor-wait' : 'bg-purple-600 hover:bg-purple-500'}
                       ${!!exportingPath ? 'opacity-70 cursor-not-allowed' : ''}
                     `}
                   >
                     {isExportingThis ? (
                       <>
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         Processing...
                       </>
                     ) : (
                       'Create GIF'
                     )}
                   </button>
                </div>
              );
            })}
            {projects.length === 0 && (
               <p className="text-center text-gray-500 py-8">No illustrations found with history.</p>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-gray-900 border-t border-gray-700 text-right">
          <button 
            onClick={onClose}
            disabled={!!exportingPath}
            className="px-4 py-2 text-gray-300 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportGifModal;
