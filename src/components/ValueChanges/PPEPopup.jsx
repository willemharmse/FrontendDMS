import React, { useState } from "react";
import "./PPEPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const PPEPopup = ({ isOpen, onClose, role, userID, setPPEData }) => {
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
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        ppe: ppe.trim()
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    setLoading(false);
                    setMessage({ text: data.message, type: "error" });
                    return;
                }

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
                setMessage({ text: "PPE added as a suggestion.", type: "success" });

                setPPEData((prevData) => [...prevData, { ppe: ppe.trim() + " *" }]);

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
                <div className="ppe-popup-header">
                    <h2 className="ppe-popup-title">Add New PPE</h2>
                    <button className="ppe-popup-close" onClick={handleClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="ppe-popup-group">
                        <label className="ppe-popup-label">PPE:</label>
                        <input
                            spellcheck="true"
                            type="text"
                            value={ppe}
                            onChange={(e) => setPPE(e.target.value)}
                            className="ppe-popup-input"
                            required
                            placeholder="Enter PPE"
                        />
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`ppe-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="ppe-popup-buttons">
                        <button type="submit" className="ppe-popup-button">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PPEPopup;