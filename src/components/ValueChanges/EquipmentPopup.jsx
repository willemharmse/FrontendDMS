import React, { useState } from "react";
import "./EquipmentPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const EquipmentPopup = ({ isOpen, onClose }) => {
    const [eqp, setEqp] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        if (!eqp.trim()) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/eqp/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eqp: eqp.trim()
                })
            });

            if (!response.ok) throw new Error("Failed to add equipment");

            setLoading(false);
            setMessage({ text: "Equipment added successfully!", type: "success" });

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (error) {
            setLoading(false);
            console.error("Error adding equipment:", error);
            setMessage({ text: "Failed to add equipment", type: "error" });
        }
    };

    const handleClose = () => {
        setLoading(false);
        setEqp("");
        setMessage({ text: "", type: "" });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="eqp-popup-overlay">
            <div className="eqp-popup-content">
                <h3 className="eqp-popup-title">Add New Equipment</h3>
                <form onSubmit={handleSubmit}>
                    <div className="eqp-input-group">
                        <label>Equipment:</label>
                        <input
                            type="text"
                            value={eqp}
                            onChange={(e) => setEqp(e.target.value)}
                            className="eqp-popup-input"
                            required
                        />
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`eqp-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="eqp-popup-actions">
                        <button type="submit" className="eqp-popup-btn confirm">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add Equipment'}
                        </button>
                        <button
                            type="button"
                            className="eqp-popup-btn cancel"
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

export default EquipmentPopup;