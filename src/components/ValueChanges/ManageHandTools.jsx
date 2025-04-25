import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageHandTools.css";

const ManageHandTools = ({ closePopup, onClose }) => {
    const [handTools, setHandTools] = useState([]);
    const [selectedTool, setSelectedTool] = useState("");
    const [toolInp, setToolInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchHandTools();
    }, []);

    const closeFunction = () => {
        onClose();
        closePopup();
    }

    const fetchHandTools = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/tool`);
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
            setError("Please select tool.");
            return;
        }

        try {
            await axios.put(`${process.env.REACT_APP_URL}/api/docCreateVals/tool/update/${selectedTool}`, {
                tool: toolInp,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });

            setMessage("Tool updated successfully.");
            setError("");
            setSelectedTool("");
            setToolInp("");

            setTimeout(() => {
                setMessage("");
            }, 1000);
            fetchHandTools();
        } catch (err) {
            setError("Failed to update tool.");
        }
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

export default ManageHandTools;
