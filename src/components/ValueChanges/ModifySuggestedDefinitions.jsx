import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageAbbreviations.css";

const ModifySuggestedDefinitions = ({ closePopup, userID, setTermData, onAdd, term, definition }) => {
    const [termInp, setTermInp] = useState(term?.replace(/\s*\*$/, "") || "");
    const [definitionInp, setDefinitionInp] = useState(definition);

    const closeFunction = () => {
        handleClose();
    }

    const handleUpdate = async () => {
        try {
            const updatedTerm = termInp.trim();
            const updatedDefinition = definitionInp.trim();

            const newTermObj = {
                term: updatedTerm + " *",
                definition: updatedDefinition
            };

            // Replace the old abbreviation in the list
            setTermData((prevData) =>
                prevData
                    .filter(item => !(item.term === term && item.definition === definition)) // Remove the old
                    .concat(newTermObj) // Add the new
            );

            if (onAdd) onAdd(newTermObj, term, definition); // Inform parent about the change

            setTermInp("");
            setDefinitionInp("");

            setTimeout(() => {
                handleClose();
            }, 500);
        } catch (err) {
        }
    };

    const handleClose = () => {
        setTermInp("");
        setDefinitionInp("");
        closePopup();
    };

    return (
        <div className="manDefs-popup-container">
            <div className="manDefs-popup-box">
                <div className="manDefs-popup-header">
                    <h2 className="manDefs-popup-title">Update Term</h2>
                    <button className="manDefs-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="manDefs-popup-group">
                    <label className="manDefs-popup-label">Term</label>
                    <input spellcheck="true" className="manDefs-input" placeholder="Insert New Term" type="text" value={termInp} onChange={(e) => setTermInp(e.target.value)} />
                </div>

                <div className="manDefs-popup-group">
                    <label className="manDefs-popup-label">Term Definition</label>
                    <textarea rows={4} spellcheck="true" className="manDefs-input-text-area" placeholder="Insert new term definition" type="text" value={definitionInp} onChange={(e) => setDefinitionInp(e.target.value)} />
                </div>

                <div className="manDefs-buttons">
                    <button className="manDefs-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModifySuggestedDefinitions;
