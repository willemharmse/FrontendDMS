import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from "react-toastify";

const ModifyFTSField = ({ isOpen, onClose, data }) => {
    const [fieldName, setFieldName] = useState("");
    const [definition, setDefinition] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setFieldName(data?.field || "");
        setDefinition(data?.definition || "");
    }, [data])

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        if (!fieldName.trim() || !definition.trim()) {
            setLoading(false);
            toast.error("Fill in both fields", { autoClose: 1000, closeButton: false });
            return;
        }

        try {
            const route = `/api/ftsImports/modifyStandardField/${data._id}`;

            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                method: "PUT",
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
                toast.error(responseData?.error || "Failed to modify field", { closeButton: false, autoClose: 1000 });
                return;
            }

            setLoading(false);
            toast.success("Successfully Modified Field.", { closeButton: false, autoClose: 1000 });

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (error) {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="term-popup-overlay">
            <div className="term-popup-content">
                <div className="term-popup-header">
                    <h2 className="term-popup-title">Modify Standard Field</h2>
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
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModifyFTSField;