import React, { useState } from "react";
import "./TermPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const TermPopup = ({ isOpen, onClose, role, userID }) => {
    const [term, setTerm] = useState("");
    const [definition, setDefinition] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        if (!term.trim() || !definition.trim()) {
            alert("Please fill in both fields");
            return;
        }

        try {
            const route = role === "admin" ? `/api/docCreateVals/def/add` : `/api/docCreateVals/draft`;

            if (role === "admin") {
                const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        term: term.trim(),
                        definition: definition.trim()
                    })
                });

                if (!response.ok) throw new Error("Failed to add term");

                setLoading(false);
                setMessage({ text: "Term added successfully!", type: "success" });

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
            else {
                const data = { term, definition };
                const type = "Definition";
                const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type, data, userID
                    })
                });

                if (!response.ok) throw new Error("Failed to add term");

                setLoading(false);
                setMessage({ text: "Term added successfully!", type: "success" });

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
        } catch (error) {
            setLoading(false);
            console.error("Error adding term:", error);
            setMessage({ text: "Failed to add term", type: "error" });
        }
    };

    const handleClose = () => {
        setTerm("");
        setLoading(false);
        setMessage({ text: "", type: "" });
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
                            spellcheck="true"
                            type="text"
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            className="term-popup-input"
                            required
                        />
                    </div>
                    <div className="term-input-group">
                        <label>Definition:</label>
                        <input
                            spellcheck="true"
                            type="text"
                            value={definition}
                            onChange={(e) => setDefinition(e.target.value)}
                            className="term-popup-input"
                            required
                        />
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`term-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="term-popup-actions">
                        <button type="submit" className="term-popup-btn confirm">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add Term'}
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