import React, { useState, useEffect } from "react";
import "./TermPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const TermPopup = ({ isOpen, onClose, userID, setTermData, onAdd }) => {
    const [term, setTerm] = useState("");
    const [definition, setDefinition] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);
    const [approver, setApprover] = useState("");
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        // Function to fetch users
        const fetchUsers = async () => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_URL}/api/user/getSystemAdmins/DDS`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();

                setUsersList(data.users);
            } catch (error) {
                console.log(error);
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        if (!term.trim() || !definition.trim()) {
            alert("Please fill in both fields");
            return;
        }

        try {
            const route = `/api/docCreateVals/draft`;

            const data = { term, definition };
            const type = "Definition";
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    type, data, userID, approver
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

            const newTermArr = {
                term: term.trim() + " *",
                definition: definition.trim()
            };
            setTermData((prevData) => [...prevData, newTermArr]);

            if (onAdd) onAdd(newTermArr);

            setTimeout(() => {
                handleClose();
            }, 1000);
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
                    <h2 className="term-popup-title">Suggest New Term</h2>
                    <button className="term-popup-close" onClick={handleClose} title="Close Popup">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="term-popup-scrollable">
                        {/* Success/Error Message Box */}
                        {message.text && (
                            <div className={`term-message ${message.type}`} style={{ marginTop: "0px", marginBottom: "10px" }}>
                                {message.text}
                            </div>
                        )}

                        <div className="term-popup-group">
                            <label className="term-popup-label">Term</label>
                            <input
                                spellcheck="true"
                                type="text"
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                                className="term-popup-input"
                                required
                                placeholder="Insert term here"
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
                                placeholder="Insert description here"
                            />
                        </div>

                        <div className="term-popup-group">
                            <label className="abbr-popup-label">Approver:</label>
                            <div className="abbr-popup-page-select-container">
                                <select
                                    spellcheck="true"
                                    type="text"
                                    value={approver}
                                    onChange={(e) => setApprover(e.target.value)}
                                    className="abbr-popup-select"
                                    required
                                    placeholder="Select Approver"
                                >
                                    <option value="">Select Approver</option>
                                    {usersList.map((value, index) => (
                                        <option key={index} value={value.id || value._id || value}>
                                            {value.username || value.label || value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
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