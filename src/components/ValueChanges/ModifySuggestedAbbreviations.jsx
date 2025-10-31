import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageDefinitions.css";

const ModifySuggestedAbbreviations = ({ closePopup, setAbbrData, onAdd, userID, abbr, meaning }) => {
    const [abbrInp, setAbbrInp] = useState(abbr?.replace(/\s*\*$/, "") || "");
    const [meanInp, setMeanInp] = useState(meaning);

    const closeFunction = () => {
        handleClose();
    }

    const handleUpdate = async () => {
        try {
            const updatedAbbr = abbrInp.trim();
            const updatedMeaning = meanInp.trim();

            const newAbbrObj = {
                abbr: updatedAbbr + " *",
                meaning: updatedMeaning
            };

            // Replace the old abbreviation in the list
            setAbbrData((prevData) =>
                prevData
                    .filter(item => !(item.abbr === abbr && item.meaning === meaning)) // Remove the old
                    .concat(newAbbrObj) // Add the new
            );

            if (onAdd) onAdd(newAbbrObj, abbr, meaning); // Inform parent about the change

            setAbbrInp("");
            setMeanInp("");

            setTimeout(() => {
                handleClose();
            }, 500);
        } catch (err) {
        }
    };

    const handleClose = () => {
        setAbbrInp("");
        setMeanInp("");
        closePopup();
    };

    return (
        <div className="manAbbr-popup-container">
            <div className="manAbbr-popup-box">
                <div className="manAbbr-popup-header">
                    <h2 className="manAbbr-popup-title">Update Abbreviation</h2>
                    <button className="manAbbr-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="manAbbr-popup-group">
                    <label className="manAbbr-popup-label">Abbreviation</label>
                    <input spellcheck="true" className="manAbbr-input" placeholder="Insert New Abbreviation" type="text" value={abbrInp} onChange={(e) => setAbbrInp(e.target.value)} />
                </div>

                <div className="manAbbr-popup-group">
                    <label className="manAbbr-popup-label">Abbreviation Meaning</label>
                    <textarea rows={4} style={{ resize: "vertical" }} spellcheck="true" className="manAbbr-input" placeholder="Insert new abbreviation meaning" type="text" value={meanInp} onChange={(e) => setMeanInp(e.target.value)} />
                </div>

                <div className="manAbbr-buttons">
                    <button className="manAbbr-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModifySuggestedAbbreviations;
