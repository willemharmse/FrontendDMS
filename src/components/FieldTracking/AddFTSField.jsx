import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from "react-toastify";

const AddFTSField = ({ isOpen, onClose }) => {
    const [fieldName, setFieldName] = useState("");
    const [definition, setDefinition] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        if (!fieldName.trim() || !definition.trim()) {
            setLoading(false);
            toast.error("Fill in both fields", { autoClose: 1000, closeButton: false });
            return;
        }

        try {
            const route = `/api/ftsImports/addStandardField`;

            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    field: fieldName, definition
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                setLoading(false);
                toast.error(responseData?.error || "Failed to add field", { closeButton: false, autoClose: 1000 });
                return;
            }

            setLoading(false);
            toast.success("Successfully Added Field.", { closeButton: false, autoClose: 1000 });

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (error) {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFieldName("");
        setDefinition("");
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="term-popup-overlay">
            <div className="term-popup-content">
                <div className="term-popup-header">
                    <h2 className="term-popup-title">Add New Field</h2>
                    <button className="term-popup-close" onClick={handleClose} title="Close Popup">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="term-popup-scrollable">
                        <div className="term-popup-group">
                            <label className="term-popup-label">Term</label>
                            <textarea
                                spellcheck="true"
                                type="text"
                                value={fieldName}
                                onChange={(e) => setFieldName(e.target.value)}
                                className="term-popup-text-area"
                                style={{ resize: "none", minHeight: "18px" }}
                                required
                                placeholder="Insert field name here"
                            />
                        </div>
                        <div className="term-popup-group">
                            <label className="term-popup-label">Description</label>
                            <textarea
                                rows="4"
                                spellcheck="true"
                                type="text"
                                value={definition}
                                onChange={(e) => setDefinition(e.target.value)}
                                className="term-popup-text-area"
                                required
                                placeholder="Insert description here"
                                style={{ resize: "vertical" }}
                            />
                        </div>
                    </div>
                    <div className="term-popup-buttons">
                        <button type="submit" className="term-popup-button">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFTSField;