import React, { useState } from "react";
import "./TermPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const TermPopup = ({ isOpen, onClose, role, userID, setTermData }) => {
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
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        term: term.trim(),
                        definition: definition.trim()
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    setLoading(false);
                    setMessage({ text: data.message, type: "error" });
                    return;
                }

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
                setMessage({ text: "Term added successfully!", type: "success" });

                setTermData((prevData) => [...prevData, { term: term.trim() + " *", definition: definition.trim() }]);

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
                <div className="term-popup-header">
                    <h2 className="term-popup-title">Add New Term</h2>
                    <button className="term-popup-close" onClick={handleClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="term-popup-group">
                        <label className="term-popup-label">Term</label>
                        <input
                            spellcheck="true"
                            type="text"
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            className="term-popup-input"
                            required
                            placeholder="Enter term here"
                        />
                    </div>
                    <div className="term-popup-group">
                        <label className="term-popup-label">Description</label>
                        <textarea
                            rows="4"
                            spellcheck="true"
                            type="text"
                            value={definition}
                            onChange={(e) => setDefinition(e.target.value)}
                            className="term-popup-text-area"
                            required
                            placeholder="Enter description here"
                        />
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`term-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="term-popup-buttons">
                        <button type="submit" className="term-popup-button">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TermPopup;