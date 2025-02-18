import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageDefinitions.css";

const ManageAbbreviations = ({ closePopup, onClose }) => {
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
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/abbr`);
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
            await axios.put(`${process.env.REACT_APP_URL}/api/docCreateVals/abbr/update/${selectedAbbreviation}`, {
                abbr: abbrInp,
                meaning: meanInp,
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
                <h2>Manage Abbreviations</h2>

                <div className="manAbbr-form-group-manage">
                    <label>Select Abbreviation</label>
                    <select className="manAbbr-select" value={selectedAbbreviation} onChange={handleSelectChange}>
                        <option value="">-- Select --</option>
                        {abbreviations.sort((a, b) => a.abbr.localeCompare(b.abbr)).map((abbr) => (
                            <option key={abbr.abbr} value={abbr.abbr}>{abbr.abbr}</option>
                        ))}
                    </select>
                </div>

                <div className="manAbbr-form-group-manage">
                    <label>Abbreviation</label>
                    <input spellcheck="true" className="manAbbr-input" type="text" value={abbrInp} onChange={(e) => setAbbrInp(e.target.value)} />
                </div>

                <div className="manAbbr-form-group-manage">
                    <label>Meaning</label>
                    <input spellcheck="true" className="manAbbr-input" type="text" value={meanInp} onChange={(e) => setMeanInp(e.target.value)} />
                </div>

                {message && <div className="manAbbr-message-manage">{message}</div>}
                {error && <div className="manAbbr-error-message-manage">{error}</div>}

                <div className="manAbbr-buttons-container">
                    <button className="manAbbr-update-button-manage" onClick={handleUpdate}>
                        Update Abbreviation
                    </button>
                    <button className="manAbbr-close-button" onClick={closeFunction}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageAbbreviations;
