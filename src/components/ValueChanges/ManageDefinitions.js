import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ManageDefinitions.css";

export default function ManageDefinitions() {
    const navigate = useNavigate();
    const [definitions, setDefinitions] = useState([]);
    const [selectedDefinition, setSelectedDefinition] = useState("");
    const [termInp, setTermInp] = useState("");
    const [definitionInp, setDefinitionInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDefinitions();
    }, []);

    const fetchDefinitions = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/def`);
            setDefinitions(response.data.defs);
        } catch (err) {
            setError("Failed to load definitions.");
        }
    };

    const handleSelectChange = (event) => {
        const selected = event.target.value;
        setSelectedDefinition(selected);
        const definition = definitions.find((term) => term.term === selected);
        if (definition) {
            setTermInp(definition.term || "");
            setDefinitionInp(definition.definition || "");
        } else {
            setTermInp("");
            setDefinitionInp("");
        }
    };

    const handleUpdate = async () => {
        if (!selectedDefinition) {
            setError("Please select an abbreviation.");
            return;
        }

        try {
            await axios.put(`${process.env.REACT_APP_URL}/api/docCreateVals/def/update/${selectedDefinition}`, {
                term: termInp,
                definition: definitionInp,
            });

            setMessage("Definition updated successfully.");
            setError("");
            fetchDefinitions();
        } catch (err) {
            setError("Failed to update definition.");
        }
    };

    return (
        <div className="manage-page-container-def-man">
            <button className="logo-button-def-man" onClick={() => navigate('/FrontendDMS/home')}>
                <img src="logo.webp" alt="Home" />
            </button>
            <button className="log-button-def-man" onClick={() => navigate('/FrontendDMS/')}>
                Log Out
            </button>
            <button className="back-button-def-man" onClick={() => navigate('/FrontendDMS/documentCreate')}>
                Back
            </button>

            <div className="manage-box-def-man">
                <h2>Manage Definitions</h2>

                <div className="form-group-def-man">
                    <label>Select Definition</label>
                    <select value={selectedDefinition} onChange={handleSelectChange}>
                        <option value="">-- Select --</option>
                        {definitions.map((term) => (
                            <option key={term.term} value={term.term}>{term.term}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group-def-man">
                    <label>Term</label>
                    <input type="text" value={termInp} onChange={(e) => setTermInp(e.target.value)} />
                </div>

                <div className="form-group-def-man">
                    <label>Definition</label>
                    <input type="text" value={definitionInp} onChange={(e) => setDefinitionInp(e.target.value)} />
                </div>

                <button className="update-button-def-man" onClick={handleUpdate}>
                    Update Definition
                </button>

                {message && <div className="message-def-man">{message}</div>}
                {error && <div className="error-message-def-man">{error}</div>}
            </div>
        </div>
    );
}
