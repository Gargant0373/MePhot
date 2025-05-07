import { useState, useEffect } from "react";
import { useConfig } from "../context/ConfigContext";
import { fetchFolders } from "../services/api";
import "./FolderPage.css";
import folderIcon from "../assets/folder-icon.svg";

interface FolderPageProps {
  onSelectFolder: (folderName: string) => void;
}

function FolderPage({ onSelectFolder }: FolderPageProps) {
  const { serverUrl, password } = useConfig();
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFolders = async () => {
      setLoading(true);
      try {
        const folderList = await fetchFolders({ serverUrl, password });
        setFolders(folderList);
        setError(null);
      } catch (err) {
        console.error("Error fetching folders:", err);
        setError("Failed to load folders. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    if (serverUrl && password) {
      loadFolders();
    }
  }, [serverUrl, password]);

  return (
    <div className="windows-container">
      <div className="windows-window folder-window">
        <div className="title-bar">
          <div className="title-bar-text">My Image Folders</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        <div className="window-body">
          {loading ? (
            <div className="loading-indicator">Loading folders...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : folders.length === 0 ? (
            <div className="empty-message">No folders found.</div>
          ) : (
            <div className="folder-view">
              {folders.map((folderName) => (
                <div 
                  key={folderName} 
                  className="folder-item"
                  onClick={() => onSelectFolder(folderName)}
                  onDoubleClick={() => onSelectFolder(folderName)}
                >
                  <div className="folder-icon">
                    {folderIcon ? (
                      <img src={folderIcon} alt="Folder" />
                    ) : (
                      <div className="fallback-folder-icon">📁</div>
                    )}
                  </div>
                  <div className="folder-name">{folderName}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="status-bar">
          <div className="status-bar-text">
            {loading ? "Loading..." : 
             error ? "Error loading folders" : 
             `${folders.length} folder(s) found`}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FolderPage;