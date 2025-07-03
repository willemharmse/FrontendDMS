import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RiskManageHandTools.css";

const RiskManageHandTools = ({ closePopup, onClose, onUpdate, setToolData, onAdd, userID }) => {
    const [handTools, setHandTools] = useState([]);
    const [selectedTool, setSelectedTool] = useState("");
    const [toolInp, setToolInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [usersList, setUsersList] = useState([]);
    const [approver, setApprover] = useState("");

    useEffect(() => {
        // Function to fetch users
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();

                setUsersList(data.users);
            } catch (error) {
                console.log(error);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchHandTools();
    }, []);

    const closeFunction = () => {
        onClose();
        closePopup();
    }

    const fetchHandTools = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/riskInfo/tool`);
            setHandTools(response.data.tools);
        } catch (err) {
            setError("Failed to load hand tools.");
        }
    };

    const handleSelectChange = (event) => {
        const selected = event.target.value;
        setSelectedTool(selected);
        const tool = handTools.find((tool) => tool.tool === selected);
        if (tool) {
            setToolInp(tool.tool || "");
        } else {
            setToolInp("");
        }
    };

    const handleUpdate = async () => {
        if (!selectedTool) {
            setError("Please select a tool.");
            return;
        }

        const data = { tool: toolInp };
        const type = "Tool";
        const route = `/api/riskInfo/draft`;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    type, data, userID, approver
                })
            });

            setMessage("Tool update suggested successfully.");
            setError("");
            setSelectedTool("");
            setToolInp("");
            const newTool = {
                tool: toolInp.trim() + " *",
            };
            setToolData((prevData) => [...prevData, newTool]);

            if (onAdd) onAdd(newTool);

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (err) {
            setError("Failed to update tool.");
        }
    };

    const handleClose = () => {
        setToolInp("");
        setMessage("");
        setApprover("");
        onClose();
    };

    return (
        <div className="manTool-popup-container">
            <div className="manTool-popup-box">
                <div className="manTool-popup-header">
                    <h2 className="manTool-popup-title">Update Tool</h2>
                    <button className="manTool-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="manTool-popup-group">
                    <label className="manTool-popup-label">Existing Tool Name</label>
                    <select className="manTool-select" value={selectedTool} onChange={handleSelectChange}>
                        <option value="">Select Existing Tool Name</option>
                        {handTools.sort((a, b) => a.tool.localeCompare(b.tool)).map((tool) => (
                            <option key={tool.tool} value={tool.tool}>{tool.tool}</option>
                        ))}
                    </select>
                </div>

                <div className="manTool-popup-group">
                    <label className="manTool-popup-label">New Tool Name</label>
                    <input spellcheck="true" className="manTool-input" placeholder="Insert New Tool Name" type="text" value={toolInp} onChange={(e) => setToolInp(e.target.value)} />
                </div>

                <div className="abbr-popup-group">
                    <label className="abbr-popup-label">Approver:</label>
                    <div className="abbr-popup-page-select-container">
                        <select
                            spellcheck="true"
                            type="text"
                            value={approver}
                            onChange={(e) => setApprover(e.target.value)}
                            className="abbr-popup-select"
                            required
                            placeholder="Select Approver"
                        >
                            <option value="">Select Approver</option>
                            {usersList.map((value, index) => (
                                <option key={index} value={value.id || value._id || value}>
                                    {value.username || value.label || value}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {message && <div className="manTool-message-manage">{message}</div>}
                {error && <div className="manTool-error-message-manage">{error}</div>}

                <div className="manTool-buttons">
                    <button className="manTool-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RiskManageHandTools;
