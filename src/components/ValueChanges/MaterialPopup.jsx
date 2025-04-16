import React, { useState } from "react";
import "./MaterialPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';

const MaterialPopup = ({ isOpen, onClose, role, userID, setMatsData }) => {
    const [mat, setMat] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        if (!mat.trim()) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const route = role === "admin" ? `/api/docCreateVals/mat/add` : `/api/docCreateVals/draft`;

            if (role === "admin") {
                const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        mat: mat.trim()
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    setLoading(false);
                    setMessage({ text: data.message, type: "error" });
                    return;
                }

                setLoading(false);
                setMessage({ text: "Material added successfully!", type: "success" });

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
            else {
                const data = { mat };
                const type = "Material";
                const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        type, data, userID
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

                setMatsData((prevData) => [...prevData, { mat: mat.trim() + " *" }]);

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
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
                    <h2 className="mat-popup-title">Add New Material</h2>
                    <button className="mat-popup-close" onClick={handleClose}>×</button>
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
                            placeholder="Enter material name"
                        />
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