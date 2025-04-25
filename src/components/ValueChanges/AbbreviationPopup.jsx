import React, { useState } from "react";
import "./AbbreviationPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const AbbreviationPopup = ({ isOpen, onClose, role, userID, setAbbrData }) => {
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
            const route = role === "admin" ? `/api/docCreateVals/abbr/add` : `/api/docCreateVals/draft`;

            if (role === "admin") {
                const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        abbr: abbreviation.trim(),
                        meaning: meaning.trim()
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    setLoading(false);
                    setMessage({ text: data.message, type: "error" });
                    return;
                }

                setLoading(false);
                setMessage({ text: "Abbreviation added successfully!", type: "success" });

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
            else {
                const data = { abbr: abbreviation, meaning };
                const type = "Abbreviation";
                const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        type, data, userID
                    })
                });

                const responseData = await response.json();

                if (!response.ok) {
                    setLoading(false);
                    setMessage({ text: responseData.message, type: "error" });
                    return;
                }

                setLoading(false);
                setMessage({ text: "Abbreviation added as a suggestion.", type: "success" });

                setAbbrData((prevData) => [...prevData, { abbr: abbreviation.trim() + " *", meaning: meaning.trim() }]);

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
        } catch (error) {
            setLoading(false);
            console.error("Error adding abbreviation:", error);
            setMessage({ text: "Failed awddd abbreviation", type: "error" });
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
                <div className="abbr-popup-header">
                    <h2 className="abbr-popup-title">Suggest New Abbreviation</h2>
                    <button className="abbr-popup-close" onClick={handleClose} title="Close Popup">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="abbr-popup-group">
                        <label className="abbr-popup-label">Abbreviation:</label>
                        <input
                            spellcheck="true"
                            type="text"
                            value={abbreviation}
                            onChange={(e) => setAbbreviation(e.target.value)}
                            className="abbr-popup-input"
                            required
                            placeholder="Enter abbreviation code here"
                        />
                    </div>
                    <div className="abbr-popup-group">
                        <label className="abbr-popup-label">Description:</label>
                        <textarea
                            rows="4"
                            spellcheck="true"
                            type="text"
                            value={meaning}
                            onChange={(e) => setMeaning(e.target.value)}
                            className="abbr-popup-text-area"
                            required
                            placeholder="Enter description here"
                        />
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`abbr-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="abbr-popup-buttons">
                        <button type="submit" className="abbr-popup-button">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AbbreviationPopup;