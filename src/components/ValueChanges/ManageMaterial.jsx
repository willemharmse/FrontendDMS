import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageMaterial.css";

const ManageMaterial = ({ closePopup, onClose }) => {
    const [materials, setMaterials] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState("");
    const [matInp, setMatInp] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchMaterials();
    }, []);

    const closeFunction = () => {
        onClose();
        closePopup();
    }

    const fetchMaterials = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/mat`);
            setMaterials(response.data.mats);
        } catch (err) {
            setError("Failed to load materials.");
        }
    };

    const handleSelectChange = (event) => {
        const selected = event.target.value;
        setSelectedMaterial(selected);
        const material = materials.find((mat) => mat.mat === selected);
        if (material) {
            setMatInp(material.mat || "");
        } else {
            setMatInp("");
        }
    };

    const handleUpdate = async () => {
        if (!selectedMaterial) {
            setError("Please select a material.");
            return;
        }

        try {
            await axios.put(`${process.env.REACT_APP_URL}/api/docCreateVals/mat/update/${selectedMaterial}`, {
                mat: matInp,
            });

            setMessage("Material updated successfully.");
            setError("");
            setSelectedMaterial("");
            setMatInp("");

            setTimeout(() => {
                setMessage("");
            }, 1000);
            fetchMaterials();
        } catch (err) {
            setError("Failed to update material.");
        }
    };

    return (
        <div className="manMat-popup-container">
            <div className="manMat-popup-box">
                <h2>Manage Materials</h2>

                <div className="manMat-form-group-manage">
                    <label>Select Material</label>
                    <select className="manMat-select" value={selectedMaterial} onChange={handleSelectChange}>
                        <option value="">-- Select --</option>
                        {materials.sort((a, b) => a.mat.localeCompare(b.mat)).map((mat) => (
                            <option key={mat.mat} value={mat.mat}>{mat.mat}</option>
                        ))}
                    </select>
                </div>

                <div className="manMat-form-group-manage">
                    <label>Material</label>
                    <input className="manMat-input" type="text" value={matInp} onChange={(e) => setMatInp(e.target.value)} />
                </div>

                {message && <div className="manMat-message-manage">{message}</div>}
                {error && <div className="manMat-error-message-manage">{error}</div>}

                <div className="manMat-buttons-container">
                    <button className="manMat-update-button-manage" onClick={handleUpdate}>
                        Update Material
                    </button>
                    <button className="manMat-close-button" onClick={closeFunction}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageMaterial;
