import { useState, useEffect } from "react";
import { useConfig } from "../context/ConfigContext";
import { testConnection, bypassNgrokWarning } from "../services/api";
import "./AuthenticationPage.css";

function AuthenticationPage(props: { setAuthenticated: (authenticated: boolean) => void }) {
    const { serverUrl, setServerUrl, password, setPassword } = useConfig();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [ngrokDetected, setNgrokDetected] = useState(false);

    useEffect(() => {
        setNgrokDetected(serverUrl.includes('ngrok'));
    }, [serverUrl]);

    const handleServerUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setServerUrl(event.target.value);
    };

    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };

    const validateConnection = async () => {
        if (!serverUrl) {
            setError("Please enter the server URL");
            setTimeout(() => setError(null), 3000);
            return false;
        }

        if (!password) {
            setError("Please enter the password");
            setTimeout(() => setError(null), 3000);
            return false;
        }

        setIsLoading(true);
        try {
            if (ngrokDetected) {
                await bypassNgrokWarning(serverUrl);
            }
            
            const isConnected = await testConnection({ serverUrl, password });
            
            if (isConnected) {
                props.setAuthenticated(true);
                return true;
            } else {
                if (ngrokDetected) {
                    setError("Connection failed. If using ngrok, try visiting the URL directly in a new tab first.");
                } else {
                    setError("Connection failed. Please check the server URL and password");
                }
                setTimeout(() => setError(null), 5000);
                return false;
            }
        } catch (error) {
            console.error("Connection error:", error);
            setError("Connection error. Please check the server URL and ensure it's running");
            setTimeout(() => setError(null), 3000);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await validateConnection();
    };

    // Function to open ngrok URL in a new tab
    const openNgrokUrl = () => {
        window.open(serverUrl, '_blank');
    };

    return (
        <div className="windows-container">
            <div className="windows-window">
                <div className="title-bar">
                    <div className="title-bar-text">Server Connection</div>
                    <div className="title-bar-controls">
                        <button aria-label="Minimize"></button>
                        <button aria-label="Maximize"></button>
                        <button aria-label="Close"></button>
                    </div>
                </div>
                <div className="window-body">
                    <form onSubmit={handleSubmit}>
                        <div className="field-row">
                            <label htmlFor="serverUrl">Server URL:</label>
                            <input 
                                id="serverUrl"
                                type="text" 
                                value={serverUrl} 
                                onChange={handleServerUrlChange}
                                className="windows-input"
                                placeholder="http://localhost:3000"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="field-row">
                            <label htmlFor="password">Password:</label>
                            <input 
                                id="password"
                                type="password" 
                                value={password} 
                                onChange={handlePasswordChange}
                                className="windows-input"
                                placeholder="password"
                                disabled={isLoading}
                            />
                        </div>
                        {ngrokDetected && (
                            <div className="ngrok-notice">
                                <p>Ngrok URL detected. If connection fails, try visiting the URL directly first:</p>
                                <button 
                                    type="button"
                                    className="windows-button"
                                    onClick={openNgrokUrl}
                                >
                                    Open Ngrok URL
                                </button>
                            </div>
                        )}
                        {error && <div className="error-message">{error}</div>}
                        {isLoading && <div className="loading-message">Connecting to server...</div>}
                        <div className="field-row window-button-row">
                            <button 
                                type="submit" 
                                className="windows-button"
                                disabled={isLoading}
                            >
                                {isLoading ? "Connecting..." : "Connect"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AuthenticationPage;