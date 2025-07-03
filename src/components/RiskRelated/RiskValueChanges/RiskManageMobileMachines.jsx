import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RiskManageMobileMachines.css";

const RiskManageMobileMachines = ({ closePopup, onClose, onUpdate, setMachineData, onAdd, userID }) => {
    const [machines, setMachines] = useState([]);
    const [selectedMachine, setSelectedMachine] = useState("");
    const [macInp, setMacInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [usersList, setUsersList] = useState([]);
    const [approver, setApprover] = useState("");

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

    useEffect(() => {
        fetchMachines();
    }, []);

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

    const handleSelectChange = (event) => {
        const selected = event.target.value;
        setSelectedMachine(selected);
        const mac = machines.find((machine) => machine.machine === selected);
        if (mac) {
            setMacInp(mac.machine || "");
        } else {
            setMacInp("");
        }
    };

    const handleUpdate = async () => {
        if (!selectedMachine) {
            setError("Please select a machine.");
            return;
        }

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
            setSelectedMachine("");
            setMacInp("");
            const newMac = {
                mac: macInp.trim() + " *",
            };
            setMachineData((prevData) => [...prevData, newMac]);

            if (onAdd) onAdd(newMac);

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
                    <label className="manMac-popup-label">Existing Machine Name</label>
                    <select className="manMac-select" value={selectedMachine} onChange={handleSelectChange}>
                        <option value="">Select Existing Machine Name</option>
                        {machines.sort((a, b) => a.machine.localeCompare(b.machine)).map((machine) => (
                            <option key={machine.machine} value={machine.machine}>{machine.machine}</option>
                        ))}
                    </select>
                </div>

                <div className="manMac-popup-group">
                    <label className="manMac-popup-label">New Machine Name</label>
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
