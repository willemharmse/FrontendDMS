import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageAbbreviations.css";

const ManageDefinitions = ({ closePopup, onClose }) => {
    const [definitions, setDefinitions] = useState([]);
    const [selectedDefinition, setSelectedDefinition] = useState("");
    const [termInp, setTermInp] = useState("");
    const [definitionInp, setDefinitionInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDefinitions();
    }, []);

    const closeFunction = () => {
        onClose();
        closePopup();
    }

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
            setError("Please select an definition.");
            return;
        }

        try {
            await axios.put(`${process.env.REACT_APP_URL}/api/docCreateVals/def/update/${selectedDefinition}`, {
                term: termInp,
                definition: definitionInp,
            });

            setMessage("Term updated successfully.");
            setError("");
            setSelectedDefinition("");
            setDefinitionInp("");
            setTermInp("");

            setTimeout(() => {
                setMessage("");
            }, 1000);
            fetchDefinitions();
        } catch (err) {
            setError("Failed to update term.");
        }
    };

    return (
        <div className="manDefs-popup-container">
            <div className="manDefs-popup-box">
                <h2>Manage Terms</h2>

                <div className="manDefs-form-group-manage">
                    <label>Select Term</label>
                    <select className="manDefs-select" value={selectedDefinition} onChange={handleSelectChange}>
                        <option value="">-- Select --</option>
                        {definitions.sort((a, b) => a.term.localeCompare(b.term)).map((term) => (
                            <option key={term.term} value={term.term}>{term.term}</option>
                        ))}
                    </select>
                </div>

                <div className="manDefs-form-group-manage">
                    <label>Term</label>
                    <input spellcheck="true" className="manDefs-input" type="text" value={termInp} onChange={(e) => setTermInp(e.target.value)} />
                </div>

                <div className="manDefs-form-group-manage">
                    <label>Definition</label>
                    <input spellcheck="true" className="manDefs-input" type="text" value={definitionInp} onChange={(e) => setDefinitionInp(e.target.value)} />
                </div>

                {message && <div className="manDefs-message-manage">{message}</div>}
                {error && <div className="manDefs-error-message-manage">{error}</div>}

                <div className="manDefs-buttons-container">
                    <button className="manDefs-update-button-manage" onClick={handleUpdate}>
                        Update Term
                    </button>
                    <button className="manDefs-close-button" onClick={closeFunction}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageDefinitions;
