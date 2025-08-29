import React, { useState, useEffect } from "react";
import "./MobileMachinePopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';

const MobileMachinePopup = ({ isOpen, onClose, userID, setMacData, onAdd }) => {
    const [machine, setMachine] = useState("");
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

        if (!machine.trim()) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const route = `/api/docCreateVals/draft`;

            const data = { machine: machine };
            const type = "Mobile";
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
            setMessage({ text: "Machine added as a suggestion.", type: "success" });

            const newMac = {
                machine: machine.trim() + " *"
            };

            const newMacAdd = {
                mac: machine.trim() + " *"
            };
            setMacData((prevData) => [...prevData, newMac]);

            if (onAdd) onAdd(newMac, newMacAdd);

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (error) {
            setLoading(false);
            console.error("Error adding machine:", error);
            setMessage({ text: "Failed to add machine", type: "error" });
        }
    };

    const handleClose = () => {
        setLoading(false);
        setMachine("");
        setMessage({ text: "", type: "" });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="mac-popup-overlay">
            <div className="mac-popup-content">
                <div className="mac-popup-header">
                    <h2 className="mac-popup-title">Suggest New Machine</h2>
                    <button className="mac-popup-close" onClick={handleClose} title="Close Popup">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mac-popup-group">
                        <label className="mac-popup-label">Machine:</label>
                        <input
                            spellcheck="true"
                            type="text"
                            value={machine}
                            onChange={(e) => setMachine(e.target.value)}
                            className="mac-popup-input"
                            required
                            placeholder="Insert machine name"
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
                        <div className={`mac-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="mac-popup-buttons">
                        <button type="submit" className="mac-popup-button">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MobileMachinePopup;