import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageMaterial.css";

const ModifySuggestedMaterial = ({ closePopup, setMatData, onAdd, userID, mat }) => {
    const [matInp, setMatInp] = useState(mat?.replace(/\s*\*$/, "") || "");

    const closeFunction = () => {
        closePopup();
    }

    const handleUpdate = async () => {
        try {
            const updatedMat = matInp.trim();

            const newMatObj = {
                mat: updatedMat + " *"
            };

            // Replace the old abbreviation in the list
            setMatData((prevData) =>
                prevData
                    .filter(item => !(item.mat === mat)) // Remove the old
                    .concat(newMatObj) // Add the new
            );

            if (onAdd) onAdd(newMatObj, mat); // Inform parent about the change

            setMatInp("");

            setTimeout(() => {
                handleClose();
            }, 500);
        } catch (err) {
        }
    };

    const handleClose = () => {
        setMatInp("");
        closeFunction();
    };

    return (
        <div className="manMat-popup-container">
            <div className="manMat-popup-box">
                <div className="manMat-popup-header">
                    <h2 className="manMat-popup-title">Update Material</h2>
                    <button className="manMat-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="manMat-popup-group">
                    <label className="manMat-popup-label">Material Name</label>
                    <textarea
                        rows="1"
                        spellcheck="true"
                        type="text"
                        value={matInp}
                        onChange={(e) => setMatInp(e.target.value)}
                        className="abbr-popup-text-area"
                        required
                        placeholder="Insert New Material Name"
                        style={{ resize: "vertical" }}
                    />
                </div>

                <div className="manMat-buttons">
                    <button className="manMat-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModifySuggestedMaterial;
