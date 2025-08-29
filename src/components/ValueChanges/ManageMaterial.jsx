import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageMaterial.css";

const ManageMaterial = ({ closePopup, onClose, onUpdate, setMatData, onAdd, userID, mat }) => {
    const [materials, setMaterials] = useState([]);
    const [matInp, setMatInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
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

    useEffect(() => {
        fetchMaterials();
    }, []);

    useEffect(() => {
        if (materials.length > 0) {
            handleLoad();
        }
    }, [materials, mat]);

    const closeFunction = () => {
        onClose();
        closePopup();
    }

    const fetchMaterials = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/mat`);
            setMaterials(response.data.mats);
        } catch (err) {
            setError("Failed to load materials.");
        }
    };

    const handleLoad = () => {
        if (!mat || materials.length === 0) return;

        const matObj = materials.find((m) => m.mat === mat);
        if (matObj) {
            setMatInp(matObj.mat || "");
        } else {
            setMatInp("");
        }
    };

    const handleUpdate = async () => {
        const data = { mat: matInp };
        const type = "Material";
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

            setMessage("Material update suggested successfully.");
            setError("");
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
                    <label className="manMat-popup-label">Material Name</label>
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

export default ManageMaterial;
