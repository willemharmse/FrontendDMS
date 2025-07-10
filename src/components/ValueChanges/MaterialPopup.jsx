import React, { useState, useEffect } from "react";
import "./MaterialPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';

const MaterialPopup = ({ isOpen, onClose, role, userID, setMatsData, onAdd }) => {
    const [mat, setMat] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);
    const [approver, setApprover] = useState("");
    const [usersList, setUsersList] = useState([]);

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

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        if (!mat.trim()) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const route = `/api/docCreateVals/draft`;

            const data = { mat: mat };
            const type = "Material";
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
            setMessage({ text: "Material added as a suggestion.", type: "success" });

            const newMat = {
                mat: mat.trim() + " *"
            };
            setMatsData((prevData) => [...prevData, newMat]);

            // 2) let the parent know so it can auto-select
            if (onAdd) onAdd(newMat);

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (error) {
            setLoading(false);
            console.error("Error adding material:", error);
            setMessage({ text: "Failed to add material", type: "error" });
        }
    };

    const handleClose = () => {
        setLoading(false);
        setMat("");
        setMessage({ text: "", type: "" });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="mat-popup-overlay">
            <div className="mat-popup-content">
                <div className="mat-popup-header">
                    <h2 className="mat-popup-title">Suggest New Material</h2>
                    <button className="mat-popup-close" onClick={handleClose} title="Close Popup">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mat-popup-group">
                        <label className="mat-popup-label">Material:</label>
                        <input
                            spellcheck="true"
                            type="text"
                            value={mat}
                            onChange={(e) => setMat(e.target.value)}
                            className="mat-popup-input"
                            required
                            placeholder="Insert material name"
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
                        <div className={`mat-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="mat-popup-buttons">
                        <button type="submit" className="mat-popup-button">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MaterialPopup;