import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RiskManageEquipment.css";

const RiskManageEquipment = ({ closePopup, onClose, onUpdate, setEqpData, onAdd, userID, eqp }) => {
    const [equipment, setEquipment] = useState([]);
    const [eqpInp, setEqpInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [usersList, setUsersList] = useState([]);
    const [approver, setApprover] = useState("");

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
        fetchEquipment();
    }, []);

    useEffect(() => {
        if (equipment.length > 0) {
            handleLoad();
        }
    }, [equipment, eqp]);

    const closeFunction = () => {
        onClose();
        closePopup();
    }

    const fetchEquipment = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/riskInfo/eqp`);
            setEquipment(response.data.eqps);
        } catch (err) {
            setError("Failed to load equipment.");
        }
    };

    const handleLoad = () => {
        if (!eqp || equipment.length === 0) return;

        const eqpObj = equipment.find((e) => e.eqp === eqp);
        if (eqpObj) {
            setEqpInp(eqpObj.eqp || "");
        } else {
            setEqpInp("");
        }
    };

    const handleUpdate = async () => {
        const data = { eqp: eqpInp };
        const type = "Equipment";
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

            setMessage("Equipment update suggested successfully.");
            setError("");
            setEqpInp("");
            const newEqp = {
                eqp: eqpInp.trim() + " *",
            };
            setEqpData((prevData) => [...prevData, newEqp]);

            if (onAdd) onAdd(newEqp);

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (err) {
            setError("Failed to update equipment.");
        }
    };

    const handleClose = () => {
        setEqpInp("");
        setMessage("");
        setApprover("");
        onClose();
    };

    return (
        <div className="manEqp-popup-container">
            <div className="manEqp-popup-box">
                <div className="manEqp-popup-header">
                    <h2 className="manEqp-popup-title">Update Equipment</h2>
                    <button className="manEqp-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="manEqp-popup-group">
                    <label className="manEqp-popup-label">Equipment Name</label>
                    <textarea
                        rows="1"
                        spellcheck="true"
                        type="text"
                        value={eqpInp}
                        onChange={(e) => setEqpInp(e.target.value)}
                        className="abbr-popup-text-area"
                        required
                        placeholder="Insert New Equipment Name"
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

                {message && <div className="manEqp-message-manage">{message}</div>}
                {error && <div className="manEqp-error-message-manage">{error}</div>}

                <div className="manEqp-buttons">
                    <button className="manEqp-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RiskManageEquipment;
