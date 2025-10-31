import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RiskManagePPE.css";

const RiskManagePPE = ({ closePopup, onClose, onUpdate, setPPEData, onAdd, userID, ppe }) => {
    const [ppes, setPpes] = useState([]);
    const [selectedPPE, setSelectedPPE] = useState("");
    const [approver, setApprover] = useState("");
    const [ppeInp, setPpeInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        // Function to fetch users
        const fetchUsers = async () => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_URL}/api/user/getSystemAdmins/RMS`,
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

    useEffect(() => {
        fetchPPE();
    }, []);

    useEffect(() => {
        if (ppes.length > 0) {
            handleLoad();
        }
    }, [ppes, ppe]);

    const closeFunction = () => {
        onClose();
        closePopup();
    }

    const fetchPPE = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/riskInfo/ppe`);
            setPpes(response.data.ppe);
        } catch (err) {
            setError("Failed to load PPE.");
        }
    };

    const handleLoad = () => {
        if (!ppe || ppes.length === 0) return;

        const ppeObj = ppes.find((p) => p.ppe === ppe);
        if (ppeObj) {
            setPpeInp(ppeObj.ppe || "");
        } else {
            setPpeInp("");
        }
    };

    const handleUpdate = async () => {
        const data = { ppe: ppeInp };
        const type = "PPE";
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

            setMessage("PPE update suggested successfully.");
            setError("");
            setPpeInp("");
            const newPpe = {
                ppe: ppeInp.trim() + " *",
            };
            setPPEData((prevData) => [...prevData, newPpe]);

            if (onAdd) onAdd(newPpe);

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (err) {
            setError("Failed to update ppe.");
        }
    };

    const handleClose = () => {
        setPpeInp("");
        setMessage("");
        setApprover("");
        onClose();
    };

    return (
        <div className="manPPE-popup-container">
            <div className="manPPE-popup-box">
                <div className="manPPE-popup-header">
                    <h2 className="manPPE-popup-title">Update PPE</h2>
                    <button className="manPPE-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="manPPE-popup-group">
                    <label className="manPPE-popup-label">PPE Name</label>

                    <textarea
                        rows="1"
                        spellcheck="true"
                        type="text"
                        value={ppeInp}
                        onChange={(e) => setPpeInp(e.target.value)}
                        className="abbr-popup-text-area"
                        required
                        placeholder="Insert New PPE Name"
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

                {message && <div className="manPPE-message-manage">{message}</div>}
                {error && <div className="manPPE-error-message-manage">{error}</div>}

                <div className="manPPE-buttons">
                    <button className="manPPE-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RiskManagePPE;
