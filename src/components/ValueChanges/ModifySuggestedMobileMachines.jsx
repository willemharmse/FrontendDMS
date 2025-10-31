import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageMobileMachines.css";

const ModifySuggestedMobileMachines = ({ closePopup, setMachineData, onAdd, userID, mac }) => {
    const [macInp, setMacInp] = useState(mac?.replace(/\s*\*$/, "") || "");

    const closeFunction = () => {
        closePopup();
    }

    const handleUpdate = async () => {
        try {
            const updatedMac = macInp.trim();


            const newMacAdd = {
                mac: updatedMac + " *"
            };

            const newMacObj = {
                machine: updatedMac + " *"
            };

            // Replace the old abbreviation in the list
            setMachineData((prevData) =>
                prevData
                    .filter(item => !(item.machine === mac)) // Remove the old
                    .concat(newMacObj) // Add the new
            );

            if (onAdd) onAdd(newMacObj, mac, newMacAdd); // Inform parent about the change

            setMacInp("");

            setTimeout(() => {
                handleClose();
            }, 500);
        } catch (err) {
        }
    };

    const handleClose = () => {
        setMacInp("");
        closeFunction();
    };

    return (
        <div className="manMac-popup-container">
            <div className="manMac-popup-box">
                <div className="manMac-popup-header">
                    <h2 className="manMac-popup-title">Update Machines</h2>
                    <button className="manMac-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="manMac-popup-group">
                    <label className="manMac-popup-label">Machine Name</label>
                    <textarea
                        rows="1"
                        spellcheck="true"
                        type="text"
                        value={macInp}
                        onChange={(e) => setMacInp(e.target.value)}
                        className="abbr-popup-text-area"
                        required
                        placeholder="Insert New Mobile Machine Name"
                        style={{ resize: "vertical" }}
                    />
                </div>

                <div className="manMac-buttons">
                    <button className="manMac-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModifySuggestedMobileMachines;
