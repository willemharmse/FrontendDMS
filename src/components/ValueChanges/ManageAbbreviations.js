import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ManageAbbreviations.css";

export default function ManageAbbreviations() {
    const navigate = useNavigate();
    const [abbreviations, setAbbreviations] = useState([]);
    const [selectedAbbreviation, setSelectedAbbreviation] = useState("");
    const [abbrInp, setAbbrInp] = useState("");
    const [meanInp, setMeanInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAbbreviations();
    }, []);

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
            fetchAbbreviations();
        } catch (err) {
            setError("Failed to update abbreviation.");
        }
    };

    return (
        <div className="manage-page-container">
            <button className="logo-button-manage" onClick={() => navigate('/FrontendDMS/home')}>
                <img src="logo.webp" alt="Home" />
            </button>
            <button className="log-button-manage" onClick={() => navigate('/FrontendDMS/')}>
                Log Out
            </button>
            <button className="back-button-manage" onClick={() => navigate('/FrontendDMS/documentCreate')}>
                Back
            </button>

            <div className="manage-box">
                <h2>Manage Abbreviations</h2>

                <div className="form-group-manage">
                    <label>Select Abbreviation</label>
                    <select value={selectedAbbreviation} onChange={handleSelectChange}>
                        <option value="">-- Select --</option>
                        {abbreviations.map((abbr) => (
                            <option key={abbr.abbr} value={abbr.abbr}>{abbr.abbr}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group-manage">
                    <label>Abbreviation</label>
                    <input type="text" value={abbrInp} onChange={(e) => setAbbrInp(e.target.value)} />
                </div>

                <div className="form-group-manage">
                    <label>Meaning</label>
                    <input type="text" value={meanInp} onChange={(e) => setMeanInp(e.target.value)} />
                </div>

                <button className="update-button-manage" onClick={handleUpdate}>
                    Update Abbreviation
                </button>

                {message && <div className="message-manage">{message}</div>}
                {error && <div className="error-message-manage">{error}</div>}
            </div>
        </div>
    );
}
