import { useState, useEffect } from "react";
import axios from "axios";
import "./ManagePPE.css";

const ModifySuggestedPPE = ({ closePopup, setPPEData, onAdd, userID, ppe }) => {
    const [ppeInp, setPpeInp] = useState(ppe?.replace(/\s*\*$/, "") || "");

    const closeFunction = () => {
        closePopup();
    }

    const handleUpdate = async () => {
        try {
            const updatedPPE = ppeInp.trim();

            const newPPEObj = {
                ppe: updatedPPE + " *"
            };

            // Replace the old abbreviation in the list
            setPPEData((prevData) =>
                prevData
                    .filter(item => !(item.ppe === ppe)) // Remove the old
                    .concat(newPPEObj) // Add the new
            );

            if (onAdd) onAdd(newPPEObj, ppe); // Inform parent about the change

            setPpeInp("");

            setTimeout(() => {
                handleClose();
            }, 500);
        } catch (err) {
        }
    };

    const handleClose = () => {
        setPpeInp("");
        closePopup();
    };

    return (
        <div className="manPPE-popup-container">
            <div className="manPPE-popup-box">
                <div className="manPPE-popup-header">
                    <h2 className="manPPE-popup-title">Update PPE</h2>
                    <button className="manPPE-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="manPPE-popup-group">
                    <label className="manPPE-popup-label">PPE Name</label>
                    <input spellcheck="true" className="manPPE-input" placeholder="Insert New PPE Name" type="text" value={ppeInp} onChange={(e) => setPpeInp(e.target.value)} />
                </div>

                <div className="manPPE-buttons">
                    <button className="manPPE-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModifySuggestedPPE;
