import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RiskManageMobileMachines.css";

const RiskManageMobileMachines = ({ closePopup, onClose, onUpdate, setMachineData, onAdd, userID, mac }) => {
    const [machines, setMachines] = useState([]);
    const [macInp, setMacInp] = useState("");
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
        fetchMachines();
    }, []);

    useEffect(() => {
        if (machines.length > 0) {
            handleLoad();
        }
    }, [machines, mac]);

    const closeFunction = () => {
        onClose();
        closePopup();
    }

    const fetchMachines = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/riskInfo/mac`);
            setMachines(response.data.macs);
        } catch (err) {
            setError("Failed to load machines.");
        }
    };

    const handleLoad = () => {
        if (!mac || machines.length === 0) return;

        const macObj = machines.find((m) => m.machine === mac);
        if (macObj) {
            setMacInp(macObj.machine || "");
        } else {
            setMacInp("");
        }
    };

    const handleUpdate = async () => {
        const data = { machine: macInp };
        const type = "Mobile";
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

            setMessage("Machine update suggested successfully.");
            setError("");
            setMacInp("");
            const newMac = {
                machine: macInp.trim() + " *"
            };

            const newMacAdd = {
                mac: macInp.trim() + " *"
            };

            setMachineData((prevData) => [...prevData, newMac]);

            if (onAdd) onAdd(newMac, newMacAdd);

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (err) {
            setError("Failed to update machine.");
        }
    };

    const handleClose = () => {
        setMacInp("");
        setMessage("");
        setApprover("");
        onClose();
    };

    return (
        <div className="manMac-popup-container">
            <div className="manMac-popup-box">
                <div className="manMac-popup-header">
                    <h2 className="manMac-popup-title">Update Machines</h2>
                    <button className="manMac-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="manMac-popup-group">
                    <label className="manMac-popup-label">Machine Name</label>
                    <input spellcheck="true" className="manMac-input" placeholder="Insert New Machine Name" type="text" value={macInp} onChange={(e) => setMacInp(e.target.value)} />
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

                {message && <div className="manMac-message-manage">{message}</div>}
                {error && <div className="manMac-error-message-manage">{error}</div>}

                <div className="manMac-buttons">
                    <button className="manMac-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RiskManageMobileMachines;
