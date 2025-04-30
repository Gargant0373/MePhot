import { useState, useRef } from "react";
import AuthenticationPage from "./pages/AuthenticationPage";
import FolderPage from "./pages/FolderPage";
import GalleryPage from "./pages/GalleryPage";
import "./App.css";

enum AppState {
  WAITING_AUTH, FOLDER, IMAGES
}

// Interface for our image cache
interface ImageCache {
  [folderName: string]: {
    images: string[];
    lastAccessed: number;
  };
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [appState, setAppState] = useState(AppState.WAITING_AUTH);
  const [folder, setFolder] = useState("");
  
  // Use a ref for image caching to persist across renders
  const imageCacheRef = useRef<ImageCache>({});
  // Keep the previous app state to handle tab retention
  const [previousState, setPreviousState] = useState<AppState | null>(null);

  const handleAuthentication = (isAuthenticated: boolean) => {
    setAuthenticated(isAuthenticated);
    if (isAuthenticated) {
      setAppState(AppState.FOLDER);
    }
  };

  const handleSelectFolder = (folderName: string) => {
    // Save current state before switching
    setPreviousState(appState);
    setFolder(folderName);
    setAppState(AppState.IMAGES);
  };

  const handleBackToFolders = () => {
    // Save current state before switching back
    setPreviousState(appState);
    setAppState(AppState.FOLDER);
  };

  // Function to access and update the image cache
  const getImageCache = (folderName: string) => {
    return imageCacheRef.current[folderName] || null;
  };

  const updateImageCache = (folderName: string, images: string[]) => {
    // Limit cache to 3 folders to prevent memory issues
    const cacheEntries = Object.entries(imageCacheRef.current);
    if (cacheEntries.length >= 3) {
      // Find and remove the oldest accessed cache entry
      const oldestEntry = cacheEntries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)[0];
      if (oldestEntry && oldestEntry[0] !== folderName) {
        delete imageCacheRef.current[oldestEntry[0]];
      }
    }
    
    // Update the cache with new data
    imageCacheRef.current[folderName] = {
      images,
      lastAccessed: Date.now()
    };
  };

  return (
    <div className="app">
      {!authenticated && (
        <AuthenticationPage setAuthenticated={handleAuthentication} />
      )}
      {authenticated && (
        <>
          {/* Use CSS to control visibility instead of mounting/unmounting */}
          <div style={{ display: appState === AppState.FOLDER ? 'block' : 'none' }}>
            <FolderPage onSelectFolder={handleSelectFolder} />
          </div>
          
          {/* Keep GalleryPage mounted but hidden when not active */}
          <div style={{ display: appState === AppState.IMAGES ? 'block' : 'none' }}>
            {(appState === AppState.IMAGES || previousState === AppState.IMAGES) && (
              <GalleryPage 
                folder={folder} 
                onBack={handleBackToFolders} 
                getImageCache={getImageCache} 
                updateImageCache={updateImageCache}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;