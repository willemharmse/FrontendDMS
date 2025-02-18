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
                <h2>Manage Equipment</h2>

                <div className="manEqp-form-group-manage">
                    <label>Select Equipment</label>
                    <select className="manEqp-select" value={selectedEquipment} onChange={handleSelectChange}>
                        <option value="">-- Select --</option>
                        {equipment.sort((a, b) => a.eqp.localeCompare(b.eqp)).map((eqp) => (
                            <option key={eqp.eqp} value={eqp.eqp}>{eqp.eqp}</option>
                        ))}
                    </select>
                </div>

                <div className="manEqp-form-group-manage">
                    <label>Equipment</label>
                    <input spellcheck="true" className="manEqp-input" type="text" value={eqpInp} onChange={(e) => setEqpInp(e.target.value)} />
                </div>

                {message && <div className="manEqp-message-manage">{message}</div>}
                {error && <div className="manEqp-error-message-manage">{error}</div>}

                <div className="manEqp-buttons-container">
                    <button className="manEqp-update-button-manage" onClick={handleUpdate}>
                        Update Equipment
                    </button>
                    <button className="manEqp-close-button" onClick={closeFunction}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageEquipment;
