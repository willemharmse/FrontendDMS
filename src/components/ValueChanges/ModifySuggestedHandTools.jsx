import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageHandTools.css";

const ModifySuggestedHandTools = ({ closePopup, setToolData, onAdd, userID, tool }) => {
    const [toolInp, setToolInp] = useState(tool?.replace(/\s*\*$/, "") || "");

    const closeFunction = () => {
        closePopup();
    }

    const handleUpdate = async () => {
        try {
            const updatedTool = toolInp.trim();

            const newToolObj = {
                tool: updatedTool + " *"
            };

            // Replace the old abbreviation in the list
            setToolData((prevData) =>
                prevData
                    .filter(item => !(item.tool === tool)) // Remove the old
                    .concat(newToolObj) // Add the new
            );

            if (onAdd) onAdd(newToolObj, tool); // Inform parent about the change

            setToolInp("");

            setTimeout(() => {
                handleClose();
            }, 500);
        } catch (err) {
        }
    };

    const handleClose = () => {
        setToolInp("");
        closeFunction();
    };

    return (
        <div className="manTool-popup-container">
            <div className="manTool-popup-box">
                <div className="manTool-popup-header">
                    <h2 className="manTool-popup-title">Update Tool</h2>
                    <button className="manTool-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="manTool-popup-group">
                    <label className="manTool-popup-label">Tool Name</label>
                    <textarea
                        rows="1"
                        spellcheck="true"
                        type="text"
                        value={toolInp}
                        onChange={(e) => setToolInp(e.target.value)}
                        className="abbr-popup-text-area"
                        required
                        placeholder="Insert New Tool Name"
                        style={{ resize: "vertical" }}
                    />
                </div>

                <div className="manTool-buttons">
                    <button className="manTool-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModifySuggestedHandTools;
