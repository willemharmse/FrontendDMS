import React, { useState } from "react";
import "./HandToolPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const ToolPopup = ({ isOpen, onClose, role, userID, setToolsData }) => {
    const [tool, setTool] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        if (!tool.trim()) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const route = role === "admin" ? `/api/docCreateVals/tool/add` : `/api/docCreateVals/draft`;

            if (role === "admin") {
                const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        tool: tool.trim()
                    })
                });

                if (!response.ok) throw new Error("Failed to add tool");

                setLoading(false);
                setMessage({ text: "Tool added successfully!", type: "success" });

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
            else {
                const data = { tool };
                const type = "Tool";
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

                if (!response.ok) throw new Error("Failed to add tool");

                setLoading(false);
                setMessage({ text: "Tool added as a suggestion.", type: "success" });

                setToolsData((prevData) => [...prevData, { tool: tool.trim() + " *" }]);

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
        } catch (error) {
            setLoading(false);
            console.error("Error adding tool:", error);
            setMessage({ text: "Failed to add tool", type: "error" });
        }
    };

    const handleClose = () => {
        setLoading(false);
        setTool("");
        setMessage({ text: "", type: "" });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="tool-popup-overlay">
            <div className="tool-popup-content">
                <h3 className="tool-popup-title">Add New Tool</h3>
                <form onSubmit={handleSubmit}>
                    <div className="tool-input-group">
                        <label>Tool:</label>
                        <input
                            spellcheck="true"
                            type="text"
                            value={tool}
                            onChange={(e) => setTool(e.target.value)}
                            className="tool-popup-input"
                            required
                        />
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`tool-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="tool-popup-actions">
                        <button type="submit" className="tool-popup-btn confirm">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add Tool'}
                        </button>
                        <button
                            type="button"
                            className="tool-popup-btn cancel"
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

export default ToolPopup;