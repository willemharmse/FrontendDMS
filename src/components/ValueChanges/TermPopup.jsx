import React, { useState } from "react";
import "./TermPopup.css";

const TermPopup = ({ isOpen, onClose }) => {
    const [term, setTerm] = useState("");
    const [definition, setDefinition] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!term.trim() || !definition.trim()) {
            alert("Please fill in both fields");
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/def/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    term: term.trim(),
                    definition: definition.trim()
                })
            });

            if (!response.ok) throw new Error("Failed to add term");

            handleClose();
        } catch (error) {
            console.error("Error adding term:", error);
            alert("Failed to add term");
        }
    };

    const handleClose = () => {
        setTerm("");
        setDefinition("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="term-popup-overlay">
            <div className="term-popup-content">
                <h3 className="term-popup-title">Add New Term</h3>
                <form onSubmit={handleSubmit}>
                    <div className="term-input-group">
                        <label>Term:</label>
                        <input
                            type="text"
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            className="term-popup-input"
                            maxLength="10"
                            required
                        />
                    </div>
                    <div className="term-input-group">
                        <label>Definition:</label>
                        <input
                            type="text"
                            value={definition}
                            onChange={(e) => setDefinition(e.target.value)}
                            className="term-popup-input"
                            required
                        />
                    </div>
                    <div className="term-popup-actions">
                        <button type="submit" className="term-popup-btn confirm">
                            Add Term
                        </button>
                        <button
                            type="button"
                            className="term-popup-btn cancel"
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

export default TermPopup;