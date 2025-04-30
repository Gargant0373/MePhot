import { useState } from "react";
import "./AuthenticationPage.css";

function AuthenticationPage(props: { setAuthenticated: (authenticated: boolean) => void }) {
    const [enteredPassword, setEnteredPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEnteredPassword(event.target.value);
    };

    const validatePassword = () => {
        if (enteredPassword === "olimpic_carrot") {
            props.setAuthenticated(true);
            return true;
        } else {
            setError("Incorrect password");
            setTimeout(() => setError(null), 3000);
            return false;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        validatePassword();
    };

    return (
        <div className="windows-container">
            <div className="windows-window">
                <div className="title-bar">
                    <div className="title-bar-text">Authentication Required</div>
                    <div className="title-bar-controls">
                        <button aria-label="Minimize"></button>
                        <button aria-label="Maximize"></button>
                        <button aria-label="Close"></button>
                    </div>
                </div>
                <div className="window-body">
                    <form onSubmit={handleSubmit}>
                        <div className="field-row">
                            <label htmlFor="password">Password:</label>
                            <input 
                                id="password"
                                type="password" 
                                value={enteredPassword} 
                                onChange={handlePasswordChange}
                                className="windows-input"
                            />
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <div className="field-row window-button-row">
                            <button type="submit" className="windows-button">OK</button>
                            <button type="button" className="windows-button">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AuthenticationPage;