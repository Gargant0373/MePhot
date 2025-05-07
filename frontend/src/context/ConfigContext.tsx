import { createContext, useState, useContext, ReactNode } from 'react';

interface ConfigContextType {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isConfigured: boolean;
}

// Create context with default values
const ConfigContext = createContext<ConfigContextType>({
  serverUrl: '',
  setServerUrl: () => {},
  password: '',
  setPassword: () => {},
  isConfigured: false,
});

// Provider component
export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [serverUrl, setServerUrl] = useState<string>(() => {
    // Try to load from localStorage on initial render
    return localStorage.getItem('serverUrl') || '';
  });
  
  const [password, setPassword] = useState<string>(() => {
    // Try to load from localStorage on initial render
    return localStorage.getItem('password') || '';
  });

  // Store values in localStorage whenever they change
  const handleSetServerUrl = (url: string) => {
    setServerUrl(url);
    localStorage.setItem('serverUrl', url);
  };

  const handleSetPassword = (pwd: string) => {
    setPassword(pwd);
    localStorage.setItem('password', pwd);
  };

  // Determine if the app is configured
  const isConfigured = Boolean(serverUrl && password);

  const value = {
    serverUrl,
    setServerUrl: handleSetServerUrl,
    password,
    setPassword: handleSetPassword,
    isConfigured,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

// Custom hook to use the context
export const useConfig = () => useContext(ConfigContext);