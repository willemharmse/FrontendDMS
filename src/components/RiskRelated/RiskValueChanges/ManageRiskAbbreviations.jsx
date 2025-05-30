import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageRiskAbbreviations.css";

const ManageRiskAbbreviations = ({ closePopup, onClose }) => {
    const [abbreviations, setAbbreviations] = useState([]);
    const [selectedAbbreviation, setSelectedAbbreviation] = useState("");
    const [abbrInp, setAbbrInp] = useState("");
    const [meanInp, setMeanInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAbbreviations();
    }, []);

    const closeFunction = () => {
        onClose();
        closePopup();
    }

    const fetchAbbreviations = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/riskInfo/abbr`);
            setAbbreviations(response.data.abbrs);
        } catch (err) {
            setError("Failed to load abbreviations.");
        }
    };

    const handleSelectChange = (event) => {
        const selected = event.target.value;
        setSelectedAbbreviation(selected);
        const abbreviation = abbreviations.find((abbr) => abbr.abbr === selected);
        if (abbreviation) {
            setAbbrInp(abbreviation.abbr || "");
            setMeanInp(abbreviation.meaning || "");
        } else {
            setAbbrInp("");
            setMeanInp("");
        }
    };

    const handleUpdate = async () => {
        if (!selectedAbbreviation) {
            setError("Please select an abbreviation.");
            return;
        }

        try {
            await axios.put(`${process.env.REACT_APP_URL}/api/riskInfo/abbr/update/${selectedAbbreviation}`, {
                abbr: abbrInp,
                meaning: meanInp,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });

            setMessage("Abbreviation updated successfully.");
            setError("");
            setSelectedAbbreviation("");
            setAbbrInp("");
            setMeanInp("");

            setTimeout(() => {
                setMessage("");
            }, 1000);
            fetchAbbreviations();
        } catch (err) {
            setError("Failed to update abbreviation.");
        }
    };

    return (
        <div className="manAbbr-popup-container">
            <div className="manAbbr-popup-box">
                <div className="manAbbr-popup-header">
                    <h2 className="manAbbr-popup-title">Update Abbreviation</h2>
                    <button className="manAbbr-popup-close" onClick={closeFunction} title="Close Popup">×</button>
                </div>

                <div className="manAbbr-popup-group">
                    <label className="manAbbr-popup-label">Existing Abbreviation</label>
                    <select className="manAbbr-select" value={selectedAbbreviation} onChange={handleSelectChange}>
                        <option value="">Select Existing Abbreviation</option>
                        {abbreviations.sort((a, b) => a.abbr.localeCompare(b.abbr)).map((abbr) => (
                            <option key={abbr.abbr} value={abbr.abbr}>{abbr.abbr}</option>
                        ))}
                    </select>
                </div>

                <div className="manAbbr-popup-group">
                    <label className="manAbbr-popup-label">New Abbreviation</label>
                    <input spellcheck="true" className="manAbbr-input" placeholder="Enter New Abbreviation" type="text" value={abbrInp} onChange={(e) => setAbbrInp(e.target.value)} />
                </div>

                <div className="manAbbr-popup-group">
                    <label className="manAbbr-popup-label">New Abbreviation Meaning</label>
                    <textarea rows={4} spellcheck="true" className="manAbbr-input" placeholder="Enter new abbreviation meaning" type="text" value={meanInp} onChange={(e) => setMeanInp(e.target.value)} />
                </div>

                {message && <div className="manAbbr-message-manage">{message}</div>}
                {error && <div className="manAbbr-error-message-manage">{error}</div>}

                <div className="manAbbr-buttons">
                    <button className="manAbbr-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageRiskAbbreviations;
