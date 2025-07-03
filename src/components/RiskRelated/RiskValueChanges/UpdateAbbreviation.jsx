import { useState, useEffect } from "react";
import axios from "axios";
import "./UpdateAbbreviation.css";

const UpdateAbbreviation = ({ onClose, data }) => {
    const [abbrInp, setAbbrInp] = useState("");
    const [meanInp, setMeanInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [id, setID] = useState("");

    const closeFunction = () => {
        onClose();
    }

    useEffect(() => {
        console.log(data);
        setAbbrInp(data.data.abbr);
        setMeanInp(data.data.meaning);
        setID(data._id);
    }, [])

    const handleUpdate = async () => {
        const data = { abbr: abbrInp, meaning: meanInp }

        try {
            await axios.post(`${process.env.REACT_APP_URL}/api/riskInfo/updateDraft/`, {
                data: data,
                id: id,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });

            setMessage("Abbreviation updated successfully.");
            setError("");
            setAbbrInp("");
            setMeanInp("");

            setTimeout(() => {
                setMessage("");
            }, 1000);
        } catch (err) {
            setError("Failed to update abbreviation.");
        }
    };

    return (
        <div className="admin-update-abbrs-popup-container">
            <div className="admin-update-abbrs-popup-box">
                <div className="admin-update-abbrs-popup-header">
                    <h2 className="admin-update-abbrs-popup-title">Update Abbreviation</h2>
                    <button className="admin-update-abbrs-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="admin-update-abbrs-popup-group">
                    <label className="admin-update-abbrs-popup-label">Abbreviation</label>
                    <input spellcheck="true" className="admin-update-abbrs-input" placeholder="Insert Abbreviation" type="text" value={abbrInp} onChange={(e) => setAbbrInp(e.target.value)} />
                </div>

                <div className="admin-update-abbrs-popup-group">
                    <label className="admin-update-abbrs-popup-label">Abbreviation Meaning</label>
                    <textarea rows={4} spellcheck="true" className="admin-update-abbrs-input" placeholder="Insert abbreviation meaning" type="text" value={meanInp} onChange={(e) => setMeanInp(e.target.value)} />
                </div>

                {message && <div className="admin-update-abbrs-message-manage">{message}</div>}
                {error && <div className="admin-update-abbrs-error-message-manage">{error}</div>}

                <div className="admin-update-abbrs-buttons">
                    <button className="admin-update-abbrs-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateAbbreviation;
