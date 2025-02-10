import React, { useState } from "react";
import "./MobileMachinePopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';

const MobileMachinePopup = ({ isOpen, onClose }) => {
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/mac/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    machine: machine.trim()
                })
            });

            if (!response.ok) throw new Error("Failed to add machine");

            setLoading(false);
            setMessage({ text: "Machine added successfully!", type: "success" });

            setTimeout(() => {
                handleClose();
            }, 1000);
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
                <h3 className="mac-popup-title">Add New Machine</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mac-input-group">
                        <label>Machine:</label>
                        <input
                            type="text"
                            value={machine}
                            onChange={(e) => setMachine(e.target.value)}
                            className="mac-popup-input"
                            required
                        />
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`mac-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="mac-popup-actions">
                        <button type="submit" className="mac-popup-btn confirm">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add Machine'}
                        </button>
                        <button
                            type="button"
                            className="mac-popup-btn cancel"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MobileMachinePopup;