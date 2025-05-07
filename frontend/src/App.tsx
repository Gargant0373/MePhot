import { useState } from "react";
import "./App.css";
import { ConfigProvider } from "./context/ConfigContext";
import AuthenticationPage from "./pages/AuthenticationPage";
import FolderPage from "./pages/FolderPage";
import GalleryPage from "./pages/GalleryPage";

enum AppState {
  WAITING_AUTH, FOLDER, IMAGES
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [appState, setAppState] = useState(AppState.WAITING_AUTH);
  const [folder, setFolder] = useState("");

  const [previousState, setPreviousState] = useState<AppState | null>(null);

  const handleAuthentication = (isAuthenticated: boolean) => {
    setAuthenticated(isAuthenticated);
    if (isAuthenticated) {
      setAppState(AppState.FOLDER);
    }
  };

  const handleSelectFolder = (folderName: string) => {
    setPreviousState(appState);
    setFolder(folderName);
    setAppState(AppState.IMAGES);
  };

  const handleBackToFolders = () => {
    setPreviousState(appState);
    setAppState(AppState.FOLDER);
  };

  return (
    <ConfigProvider>
      <div className="app">
        {!authenticated && (
          <AuthenticationPage setAuthenticated={handleAuthentication} />
        )}
        {authenticated && (
          <>
            <div style={{ display: appState === AppState.FOLDER ? 'block' : 'none' }}>
              <FolderPage onSelectFolder={handleSelectFolder} />
            </div>

            <div style={{ display: appState === AppState.IMAGES ? 'block' : 'none' }}>
              {(appState === AppState.IMAGES || previousState === AppState.IMAGES) && (
                <GalleryPage
                  folder={folder}
                  onBack={handleBackToFolders}
                />
              )}
            </div>
          </>
        )}
      </div>
    </ConfigProvider>
  );
}

export default App;