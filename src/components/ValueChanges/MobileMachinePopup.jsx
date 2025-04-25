import React, { useState } from "react";
import "./MobileMachinePopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';

const MobileMachinePopup = ({ isOpen, onClose, role, userID, setMacData }) => {
    const [machine, setMachine] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        setLoading(true);

        e.preventDefault();

        if (!machine.trim()) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const route = role === "admin" ? `/api/docCreateVals/mac/add` : `/api/docCreateVals/draft`;

            if (role === "admin") {
                const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        machine: machine.trim()
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    setLoading(false);
                    setMessage({ text: data.message, type: "error" });
                    return;
                }

                setLoading(false);
                setMessage({ text: "Machine added successfully!", type: "success" });

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
            else {
                const data = { machine };
                const type = "Mobile";
                const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        type, data, userID
                    })
                });

                const responseData = await response.json();

                if (!response.ok) {
                    setLoading(false);
                    setMessage({ text: responseData.message, type: "error" });
                    return;
                }

                setLoading(false);
                setMessage({ text: "Machine added as a suggestion.", type: "success" });

                setMacData((prevData) => [...prevData, { machine: machine.trim() + " *" }]);

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
        } catch (error) {
            setLoading(false);
            console.error("Error adding machine:", error);
            setMessage({ text: "Failed to add machine", type: "error" });
        }
    };

    const handleClose = () => {
        setLoading(false);
        setMachine("");
        setMessage({ text: "", type: "" });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="mac-popup-overlay">
            <div className="mac-popup-content">
                <div className="mac-popup-header">
                    <h2 className="mac-popup-title">Suggest New Machine</h2>
                    <button className="mac-popup-close" onClick={handleClose} title="Close Popup">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mac-popup-group">
                        <label className="mac-popup-label">Machine:</label>
                        <input
                            spellcheck="true"
                            type="text"
                            value={machine}
                            onChange={(e) => setMachine(e.target.value)}
                            className="mac-popup-input"
                            required
                            placeholder="Enter machine name"
                        />
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`mac-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="mac-popup-buttons">
                        <button type="submit" className="mac-popup-button">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MobileMachinePopup;