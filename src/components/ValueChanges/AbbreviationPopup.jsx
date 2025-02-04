import React, { useState } from "react";
import "./AbbreviationPopup.css";

const AbbreviationPopup = ({ isOpen, onClose }) => {
    const [abbreviation, setAbbreviation] = useState("");
    const [meaning, setMeaning] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!abbreviation.trim() || !meaning.trim()) {
            alert("Please fill in both fields");
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/abbr/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    abbr: abbreviation.trim(),
                    meaning: meaning.trim()
                })
            });

            if (!response.ok) throw new Error("Failed to add abbreviation");

            handleClose();
        } catch (error) {
            console.error("Error adding abbreviation:", error);
            alert("Failed to add abbreviation");
        }
    };

    const handleClose = () => {
        setAbbreviation("");
        setMeaning("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="abbr-popup-overlay">
            <div className="abbr-popup-content">
                <h3 className="abbr-popup-title">Add New Abbreviation</h3>
                <form onSubmit={handleSubmit}>
                    <div className="abbr-input-group">
                        <label>Abbreviation:</label>
                        <input
                            type="text"
                            value={abbreviation}
                            onChange={(e) => setAbbreviation(e.target.value)}
                            className="abbr-popup-input"
                            maxLength="10"
                            required
                        />
                    </div>
                    <div className="abbr-input-group">
                        <label>Description::</label>
                        <input
                            type="text"
                            value={meaning}
                            onChange={(e) => setMeaning(e.target.value)}
                            className="abbr-popup-input"
                            required
                        />
                    </div>
                    <div className="abbr-popup-actions">
                        <button type="submit" className="abbr-popup-btn confirm">
                            Add Abbreviation
                        </button>
                        <button
                            type="button"
                            className="abbr-popup-btn cancel"
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

export default AbbreviationPopup;