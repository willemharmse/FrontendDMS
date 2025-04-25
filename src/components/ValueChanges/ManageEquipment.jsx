import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageEquipment.css";

const ManageEquipment = ({ closePopup, onClose }) => {
    const [equipment, setEquipment] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState("");
    const [eqpInp, setEqpInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

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
            setError("Please select equipment.");
            return;
        }

        try {
            await axios.put(`${process.env.REACT_APP_URL}/api/docCreateVals/eqp/update/${selectedEquipment}`, {
                eqp: eqpInp,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });

            setMessage("Equipment updated successfully.");
            setError("");
            setSelectedEquipment("");
            setEqpInp("");

            setTimeout(() => {
                setMessage("");
            }, 1000);
            fetchEquipment();
        } catch (err) {
            setError("Failed to update equipment.");
        }
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
