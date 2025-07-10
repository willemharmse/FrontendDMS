import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageEquipment.css";

const ManageEquipment = ({ closePopup, onClose, onUpdate, setEqpData, onAdd, userID }) => {
    const [equipment, setEquipment] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState("");
    const [eqpInp, setEqpInp] = useState("");
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
        fetchEquipment();
    }, []);

    const closeFunction = () => {
        onClose();
        closePopup();
    }

    const fetchEquipment = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/eqp`);
            setEquipment(response.data.eqps);
        } catch (err) {
            setError("Failed to load equipment.");
        }
    };

    const handleSelectChange = (event) => {
        const selected = event.target.value;
        setSelectedEquipment(selected);
        const eqp = equipment.find((eqp) => eqp.eqp === selected);
        if (eqp) {
            setEqpInp(eqp.eqp || "");
        } else {
            setEqpInp("");
        }
    };

    const handleUpdate = async () => {
        if (!selectedEquipment) {
            setError("Please select an equipment.");
            return;
        }

        const data = { eqp: eqpInp };
        const type = "Equipment";
        const route = `/api/docCreateVals/draft`;

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
            setSelectedEquipment("");
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
                    <label className="manEqp-popup-label">Existing Equipment Name</label>
                    <select className="manEqp-select" value={selectedEquipment} onChange={handleSelectChange}>
                        <option value="">Select Existing Equipment Name</option>
                        {equipment.sort((a, b) => a.eqp.localeCompare(b.eqp)).map((eqp) => (
                            <option key={eqp.eqp} value={eqp.eqp}>{eqp.eqp}</option>
                        ))}
                    </select>
                </div>

                <div className="manEqp-popup-group">
                    <label className="manEqp-popup-label">New Equipment Name</label>
                    <input spellcheck="true" className="manEqp-input" placeholder="Insert New Equipment Name" type="text" value={eqpInp} onChange={(e) => setEqpInp(e.target.value)} />
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

export default ManageEquipment;
