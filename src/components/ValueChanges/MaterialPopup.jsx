import React, { useState } from "react";
import "./MaterialPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const MaterialPopup = ({ isOpen, onClose }) => {
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/mat/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mat: mat.trim()
                })
            });

            if (!response.ok) throw new Error("Failed to add material");

            setLoading(false);
            setMessage({ text: "Material added successfully!", type: "success" });

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
                <h3 className="mat-popup-title">Add New Material</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mat-input-group">
                        <label>Material:</label>
                        <input
                            type="text"
                            value={mat}
                            onChange={(e) => setMat(e.target.value)}
                            className="mat-popup-input"
                            required
                        />
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`mat-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="mat-popup-actions">
                        <button type="submit" className="mat-popup-btn confirm">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add Material'}
                        </button>
                        <button
                            type="button"
                            className="mat-popup-btn cancel"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MaterialPopup;