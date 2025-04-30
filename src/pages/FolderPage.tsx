import "./FolderPage.css";
import folderIcon from "../assets/folder-icon.svg"; // Using SVG instead of PNG

interface FolderPageProps {
  onSelectFolder: (folderName: string) => void;
}

function FolderPage({ onSelectFolder }: FolderPageProps) {
  // Hardcoded folder list - currently only "thegrill"
  const folders = ["thegrill"];

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
        </div>
        <div className="status-bar">
          <div className="status-bar-text">1 object(s)</div>
        </div>
      </div>
    </div>
  );
}

export default FolderPage;