import React, { useState } from "react";
import "./EquipmentPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const EquipmentPopup = ({ isOpen, onClose, role, userID, setEqpData }) => {
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
            const route = role === "admin" ? `/api/docCreateVals/eqp/add` : `/api/docCreateVals/draft`;

            if (role === "admin") {
                const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        eqp: eqp.trim()
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    setLoading(false);
                    setMessage({ text: data.message, type: "error" });
                    return;
                }

                setLoading(false);
                setMessage({ text: "Equipment added successfully!", type: "success" });

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
            else {
                const data = { eqp };
                const type = "Equipment";
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
                setMessage({ text: "Equipment added as a suggestion.", type: "success" });

                setEqpData((prevData) => [...prevData, { eqp: eqp.trim() + " *" }]);

                setTimeout(() => {
                    handleClose();
                }, 1000);
            }
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
                <div className="eqp-popup-header">
                    <h2 className="eqp-popup-title">Add New Equipment</h2>
                    <button className="eqp-popup-close" onClick={handleClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="eqp-popup-group">
                        <label className="eqp-popup-label">Equipment:</label>
                        <input
                            spellcheck="true"
                            type="text"
                            value={eqp}
                            onChange={(e) => setEqp(e.target.value)}
                            className="eqp-popup-input"
                            required
                            placeholder="Enter equipment name"
                        />
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`eqp-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="eqp-popup-buttons">
                        <button type="submit" className="eqp-popup-button">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EquipmentPopup;