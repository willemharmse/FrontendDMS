import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageRiskAbbreviations.css";

const ManageRiskAbbreviations = ({ closePopup, onClose, onUpdate, setAbbrData, onAdd, userID, abbreviation }) => {
    const [abbreviations, setAbbreviations] = useState([]);
    const [approver, setApprover] = useState("");
    const [abbrInp, setAbbrInp] = useState("");
    const [meanInp, setMeanInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        fetchAbbreviations();
    }, []);

    useEffect(() => {
        if (abbreviations.length > 0) {
            handleLoad();
        }
    }, [abbreviations, abbreviation]);

    useEffect(() => {
        // Function to fetch users
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`);
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

    const closeFunction = () => {
        onClose();
        closePopup();
    }

    const fetchAbbreviations = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/riskInfo/abbr`);
            setAbbreviations(response.data.abbrs);
        } catch (err) {
            setError("Failed to load abbreviations.");
        }
    };

    const handleLoad = () => {
        if (!abbreviation || abbreviations.length === 0) return;

        const abbrObj = abbreviations.find((a) => a.abbr === abbreviation);
        if (abbrObj) {
            setAbbrInp(abbrObj.abbr || "");
            setMeanInp(abbrObj.meaning || "");
        } else {
            setAbbrInp("");
            setMeanInp("");
        }
    };

    const handleUpdate = async () => {
        const data = { abbr: abbrInp, meaning: meanInp };
        const type = "Abbreviation";
        const route = `/api/riskInfo/draft`;

        try {
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

            setMessage("Abbreviation update suggested successfully.");
            setError("");
            setAbbrInp("");
            setMeanInp("");
            const newAbbrObj = {
                abbr: abbrInp.trim() + " *",
                meaning: meanInp.trim()
            };
            setAbbrData((prevData) => [...prevData, newAbbrObj]);

            if (onAdd) onAdd(newAbbrObj);

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (err) {
            setError("Failed to update abbreviation.");
        }
    };

    const handleClose = () => {
        setAbbrInp("");
        setMeanInp("");
        setApprover("");
        setMessage("");
        onClose();
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
                    <textarea rows={4} spellcheck="true" className="manAbbr-input" placeholder="Insert new abbreviation meaning" type="text" value={meanInp} onChange={(e) => setMeanInp(e.target.value)} />
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

                {message && <div className="manAbbr-message-manage">{message}</div>}
                {error && <div className="manAbbr-error-message-manage">{error}</div>}

                <div className="manAbbr-buttons">
                    <button className="manAbbr-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageRiskAbbreviations;
