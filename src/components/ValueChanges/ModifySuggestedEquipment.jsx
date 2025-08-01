import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageEquipment.css";

const ModifySuggestedEquipment = ({ closePopup, setEqpData, onAdd, userID, eqp }) => {
    const [eqpInp, setEqpInp] = useState(eqp?.replace(/\s*\*$/, "") || "");

    const closeFunction = () => {
        closePopup();
    }

    const handleUpdate = async () => {
        try {
            const updatedEqp = eqpInp.trim();

            const newEqpObj = {
                eqp: updatedEqp + " *"
            };

            // Replace the old abbreviation in the list
            setEqpData((prevData) =>
                prevData
                    .filter(item => !(item.eqp === eqp)) // Remove the old
                    .concat(newEqpObj) // Add the new
            );

            if (onAdd) onAdd(newEqpObj, eqp); // Inform parent about the change

            setEqpInp("");

            setTimeout(() => {
                handleClose();
            }, 500);
        } catch (err) {
        }
    };

    const handleClose = () => {
        setEqpInp("");
        closeFunction();
    };

    return (
        <div className="manEqp-popup-container">
            <div className="manEqp-popup-box">
                <div className="manEqp-popup-header">
                    <h2 className="manEqp-popup-title">Update Equipment</h2>
                    <button className="manEqp-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="manEqp-popup-group">
                    <label className="manEqp-popup-label">Equipment Name</label>
                    <input spellcheck="true" className="manEqp-input" placeholder="Insert New Equipment Name" type="text" value={eqpInp} onChange={(e) => setEqpInp(e.target.value)} />
                </div>

                <div className="manEqp-buttons">
                    <button className="manEqp-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModifySuggestedEquipment;
