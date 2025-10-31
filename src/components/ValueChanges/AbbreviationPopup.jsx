import React, { useState, useEffect } from "react";
import "./AbbreviationPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const AbbreviationPopup = ({ isOpen, onClose, userID, setAbbrData, onAdd }) => {
    const [abbreviation, setAbbreviation] = useState("");
    const [meaning, setMeaning] = useState("");
    const [approver, setApprover] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
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

        if (!abbreviation.trim() || !meaning.trim()) {
            alert("Please fill in both fields");
            return;
        }

        try {
            const route = `/api/docCreateVals/draft`;

            const data = { abbr: abbreviation, meaning };
            const type = "Abbreviation";
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
            setMessage({ text: "Abbreviation added as a suggestion.", type: "success" });

            const newAbbrObj = {
                abbr: abbreviation.trim() + " *",
                meaning: meaning.trim()
            };
            setAbbrData((prevData) => [...prevData, newAbbrObj]);

            // 2) let the parent know so it can auto-select
            if (onAdd) onAdd(newAbbrObj);

            setTimeout(() => {
                handleClose();
            }, 3000);
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
                            placeholder="Insert abbreviation code here"
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
                            placeholder="Insert description here"
                            style={{ resize: "vertical" }}
                        />
                    </div>
                    <div className="abbr-popup-group">
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