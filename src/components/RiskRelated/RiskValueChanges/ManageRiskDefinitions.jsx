import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageRiskDefinitions.css";

const ManageRiskDefinitions = ({ closePopup, onClose, onUpdate, userID, setTermData, onAdd, term }) => {
    const [definitions, setDefinitions] = useState([]);
    const [approver, setApprover] = useState("");
    const [termInp, setTermInp] = useState("");
    const [definitionInp, setDefinitionInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        fetchDefinitions();
    }, []);

    useEffect(() => {
        if (definitions.length > 0) {
            handleLoad();
        }
    }, [definitions, term]);

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

    const fetchDefinitions = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/riskInfo/def`);
            setDefinitions(response.data.defs);
        } catch (err) {
            setError("Failed to load definitions.");
        }
    };

    const handleLoad = () => {
        if (!term || definitions.length === 0) return;

        const termObj = definitions.find((t) => t.term === term);
        if (termObj) {
            setDefinitionInp(termObj.definition || "");
            setTermInp(termObj.term || "");
        } else {
            setTermInp("");
            setDefinitionInp("");
        }
    };

    const handleUpdate = async () => {
        const route = `/api/riskInfo/draft`;
        const data = { term: termInp, definition: definitionInp };
        const type = "Definition";

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

            setMessage("Term update suggested successfully.");
            setError("");
            setDefinitionInp("");
            setTermInp("");
            const newTermArr = {
                term: termInp.trim() + " *",
                definition: definitionInp.trim()
            };
            setTermData((prevData) => [...prevData, newTermArr]);

            if (onAdd) onAdd(newTermArr);

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (err) {
            setError("Failed to update term.");
        }
    };

    const handleClose = () => {
        setTermInp("");
        setMessage("");
        setApprover("");
        setDefinitionInp("");
        onClose();
    };

    return (
        <div className="manDefs-popup-container">
            <div className="manDefs-popup-box">
                <div className="manDefs-popup-header">
                    <h2 className="manDefs-popup-title">Update Term</h2>
                    <button className="manDefs-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="term-popup-scrollable">
                    <div className="manDefs-popup-group">
                        <label className="manDefs-popup-label">Term</label>
                        <input spellcheck="true" className="manDefs-input" placeholder="Insert New Term" type="text" value={termInp} onChange={(e) => setTermInp(e.target.value)} />
                    </div>

                    <div className="manDefs-popup-group">
                        <label className="manDefs-popup-label">Term Definition</label>
                        <textarea rows={4} spellcheck="true" className="manDefs-input-text-area" placeholder="Insert new term definition" type="text" value={definitionInp} onChange={(e) => setDefinitionInp(e.target.value)} />
                    </div>

                    <div className="manDefs-popup-group">
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

                    {message && <div className="manDefs-message-manage">{message}</div>}
                    {error && <div className="manDefs-error-message-manage">{error}</div>}
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

export default ManageRiskDefinitions;
