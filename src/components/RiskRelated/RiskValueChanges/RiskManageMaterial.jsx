import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RiskManageMaterial.css";

const RiskManageMaterial = ({ closePopup, onClose, onUpdate, setMatData, onAdd, userID }) => {
    const [materials, setMaterials] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState("");
    const [matInp, setMatInp] = useState("");
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
        fetchMaterials();
    }, []);

    const closeFunction = () => {
        onClose();
        closePopup();
    }

    const fetchMaterials = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/riskInfo/mat`);
            setMaterials(response.data.mats);
        } catch (err) {
            setError("Failed to load materials.");
        }
    };

    const handleSelectChange = (event) => {
        const selected = event.target.value;
        setSelectedMaterial(selected);
        const material = materials.find((mat) => mat.mat === selected);
        if (material) {
            setMatInp(material.mat || "");
        } else {
            setMatInp("");
        }
    };

    const handleUpdate = async () => {
        if (!selectedMaterial) {
            setError("Please select a material.");
            return;
        }

        const data = { mat: matInp };
        const type = "Material";
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

            setMessage("Material update suggested successfully.");
            setError("");
            setSelectedMaterial("");
            setMatInp("");
            const newMat = {
                mat: matInp.trim() + " *",
            };
            setMatData((prevData) => [...prevData, newMat]);

            if (onAdd) onAdd(newMat);

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (err) {
            setError("Failed to update material.");
        }
    }

    const handleClose = () => {
        setMatInp("");
        setMessage("");
        setApprover("");
        onClose();
    };

    return (
        <div className="manMat-popup-container">
            <div className="manMat-popup-box">
                <div className="manMat-popup-header">
                    <h2 className="manMat-popup-title">Update Material</h2>
                    <button className="manMat-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="manMat-popup-group">
                    <label className="manMat-popup-label">Existing Material Name</label>
                    <div className="abbr-popup-page-select-container">
                        <select className="manMat-select remove-default-styling" value={selectedMaterial} onChange={handleSelectChange}>
                            <option value="">Select Existing Material Name</option>
                            {materials.sort((a, b) => a.mat.localeCompare(b.mat)).map((mat) => (
                                <option key={mat.mat} value={mat.mat}>{mat.mat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="manMat-popup-group">
                    <label className="manMat-popup-label">New Material Name</label>
                    <input spellcheck="true" className="manMat-input" placeholder="Insert New Material Name" type="text" value={matInp} onChange={(e) => setMatInp(e.target.value)} />
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

                {message && <div className="manMat-message-manage">{message}</div>}
                {error && <div className="manMat-error-message-manage">{error}</div>}

                <div className="manMat-buttons">
                    <button className="manMat-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RiskManageMaterial;
