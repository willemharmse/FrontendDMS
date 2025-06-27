import { useState, useEffect } from "react";
import axios from "axios";
import "./UpdateTerm.css";

const UpdateTerm = ({ onClose, data }) => {
    const [termInp, setTermInp] = useState("");
    const [definitionInp, setDefinitionInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [id, setID] = useState("");

    const closeFunction = () => {
        onClose();
    }

    useEffect(() => {
        setTermInp(data.data.term);
        setDefinitionInp(data.data.definition);
        setID(data._id);
    }, [data])

    const handleUpdate = async () => {
        const data = { term: termInp, definition: definitionInp }

        try {
            await axios.post(`${process.env.REACT_APP_URL}/api/riskInfo/updateDraft/`, {
                data: data,
                id: id
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });

            setMessage("Term updated successfully.");
            setError("");
            setDefinitionInp("");
            setTermInp("");

            setTimeout(() => {
                setMessage("");
            }, 1000);
        } catch (err) {
            setError("Failed to update term.");
        }
    };

    return (
        <div className="admin-update-defs-popup-container">
            <div className="admin-update-defs-popup-box">
                <div className="admin-update-defs-popup-header">
                    <h2 className="admin-update-defs-popup-title">Update Term</h2>
                    <button className="admin-update-defs-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="admin-update-defs-popup-group">
                    <label className="admin-update-defs-popup-label">Term</label>
                    <input spellcheck="true" className="admin-update-defs-input" placeholder="Enter Term" type="text" value={termInp} onChange={(e) => setTermInp(e.target.value)} />
                </div>

                <div className="admin-update-defs-popup-group">
                    <label className="admin-update-defs-popup-label">Term Definition</label>
                    <textarea rows={4} spellcheck="true" className="admin-update-defs-input-text-area" placeholder="Enter term definition" type="text" value={definitionInp} onChange={(e) => setDefinitionInp(e.target.value)} />
                </div>

                {message && <div className="admin-update-defs-message-manage">{message}</div>}
                {error && <div className="admin-update-defs-error-message-manage">{error}</div>}

                <div className="admin-update-defs-buttons">
                    <button className="admin-update-defs-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateTerm;
