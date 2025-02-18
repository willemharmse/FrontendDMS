import { useState, useEffect } from "react";
import axios from "axios";
import "./ManagePPE.css";

const ManagePPE = ({ closePopup, onClose }) => {
    const [ppes, setPpes] = useState([]);
    const [selectedPPE, setSelectedPPE] = useState("");
    const [ppeInp, setPpeInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchPPE();
    }, []);

    const closeFunction = () => {
        onClose();
        closePopup();
    }

    const fetchPPE = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/ppe`);
            setPpes(response.data.ppe);
        } catch (err) {
            setError("Failed to load PPE.");
        }
    };

    const handleSelectChange = (event) => {
        const selected = event.target.value;
        setSelectedPPE(selected);
        const ppe = ppes.find((ppe) => ppe.ppe === selected);
        if (ppe) {
            setPpeInp(ppe.ppe || "");
        } else {
            setPpeInp("");
        }
    };

    const handleUpdate = async () => {
        if (!selectedPPE) {
            setError("Please select a PPE.");
            return;
        }

        try {
            await axios.put(`${process.env.REACT_APP_URL}/api/docCreateVals/ppe/update/${selectedPPE}`, {
                ppe: ppeInp,
            });

            setMessage("PPE updated successfully.");
            setError("");
            setSelectedPPE("");
            setPpeInp("");

            setTimeout(() => {
                setMessage("");
            }, 1000);
            fetchPPE();
        } catch (err) {
            setError("Failed to update PPE.");
        }
    };

    return (
        <div className="manPPE-popup-container">
            <div className="manPPE-popup-box">
                <h2>Manage PPE</h2>

                <div className="manPPE-form-group-manage">
                    <label>Select PPE</label>
                    <select className="manPPE-select" value={selectedPPE} onChange={handleSelectChange}>
                        <option value="">-- Select --</option>
                        {ppes.sort((a, b) => a.ppe.localeCompare(b.ppe)).map((ppe) => (
                            <option key={ppe.ppe} value={ppe.ppe}>{ppe.ppe}</option>
                        ))}
                    </select>
                </div>

                <div className="manPPE-form-group-manage">
                    <label>PPE</label>
                    <input spellcheck="true" className="manPPE-input" type="text" value={ppeInp} onChange={(e) => setPpeInp(e.target.value)} />
                </div>

                {message && <div className="manPPE-message-manage">{message}</div>}
                {error && <div className="manPPE-error-message-manage">{error}</div>}

                <div className="manPPE-buttons-container">
                    <button className="manPPE-update-button-manage" onClick={handleUpdate}>
                        Update PPE
                    </button>
                    <button className="manPPE-close-button" onClick={closeFunction}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManagePPE;
