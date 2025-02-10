import React, { useState } from "react";
import "./AbbreviationPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const AbbreviationPopup = ({ isOpen, onClose }) => {
    const [abbreviation, setAbbreviation] = useState("");
    const [meaning, setMeaning] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        setLoading(true);
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

            setLoading(false);
            setMessage({ text: "Abbreviation added successfully!", type: "success" });

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (error) {
            setLoading(false);
            console.error("Error adding abbreviation:", error);
            setMessage({ text: "Failed to add abbreviation", type: "error" });
        }
    };

    const handleClose = () => {
        setLoading(false);
        setAbbreviation("");
        setMeaning("");
        setMessage({ text: "", type: "" });
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
                            required
                        />
                    </div>
                    <div className="abbr-input-group">
                        <label>Description:</label>
                        <input
                            type="text"
                            value={meaning}
                            onChange={(e) => setMeaning(e.target.value)}
                            className="abbr-popup-input"
                            required
                        />
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`abbr-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="abbr-popup-actions">
                        <button type="submit" className="abbr-popup-btn confirm">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add Abbreviation'}
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