import React, { useState } from "react";
import "./PPEPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const PPEPopup = ({ isOpen, onClose, role, userID }) => {
    const [ppe, setPPE] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        if (!ppe.trim()) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const route = role === "admin" ? `/api/docCreateVals/ppe/add` : `/api/docCreateVals/draft`;

            if (role === "admin") {
                const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ppe: ppe.trim()
                    })
                });

                if (!response.ok) throw new Error("Failed to add ppe");

                setLoading(false);
                setMessage({ text: "PPE added successfully!", type: "success" });

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
            else {
                const data = { ppe };
                const type = "PPE";
                const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type, data, userID
                    })
                });

                if (!response.ok) throw new Error("Failed to add ppe");

                setLoading(false);
                setMessage({ text: "PPE added as a suggestion.", type: "success" });

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
        } catch (error) {
            setLoading(false);
            console.error("Error adding ppe:", error);
            setMessage({ text: "Failed to add ppe", type: "error" });
        }
    };

    const handleClose = () => {
        setLoading(false);
        setPPE("");
        setMessage({ text: "", type: "" });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="ppe-popup-overlay">
            <div className="ppe-popup-content">
                <h3 className="ppe-popup-title">Add New PPE</h3>
                <form onSubmit={handleSubmit}>
                    <div className="ppe-input-group">
                        <label>PPE:</label>
                        <input
                            spellcheck="true"
                            type="text"
                            value={ppe}
                            onChange={(e) => setPPE(e.target.value)}
                            className="ppe-popup-input"
                            required
                        />
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`ppe-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="ppe-popup-actions">
                        <button type="submit" className="ppe-popup-btn confirm">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add PPE'}
                        </button>
                        <button
                            type="button"
                            className="ppe-popup-btn cancel"
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

export default PPEPopup;