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
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
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
                <div className="manMat-popup-header">
                    <h2 className="manMat-popup-title">Update Material</h2>
                    <button className="manMat-popup-close" onClick={closeFunction}>×</button>
                </div>

                <div className="manMat-popup-group">
                    <label className="manMat-popup-label">Existing Material Name</label>
                    <select className="manMat-select" value={selectedMaterial} onChange={handleSelectChange}>
                        <option value="">Select Existing Material Name</option>
                        {materials.sort((a, b) => a.mat.localeCompare(b.mat)).map((mat) => (
                            <option key={mat.mat} value={mat.mat}>{mat.mat}</option>
                        ))}
                    </select>
                </div>

                <div className="manMat-popup-group">
                    <label className="manMat-popup-label">New Material Name</label>
                    <input spellcheck="true" className="manMat-input" placeholder="Insert New Material Name" type="text" value={matInp} onChange={(e) => setMatInp(e.target.value)} />
                </div>

                {message && <div className="manMat-message-manage">{message}</div>}
                {error && <div className="manMat-error-message-manage">{error}</div>}

                <div className="manMat-buttons">
                    <button className="manMat-update-button" onClick={handleUpdate}>
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageMaterial;
