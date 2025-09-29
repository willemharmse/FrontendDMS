import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const ModifyComponentName = ({ isOpen, onClose, setComponents, components, originalName }) => {
    const [name, setName] = useState(originalName || "");

    useEffect(() => {
        setName(originalName || "");
    }, [originalName]);

    const normalize = (s) => String(s || "").trim().toLowerCase();

    const submitModify = () => {
        const trimmed = String(name || "").trim();
        if (!trimmed) {
            toast.dismiss(); toast.clearWaitingQueue();
            toast.error("Please enter a valid component name.", { closeButton: true, autoClose: 800, style: { textAlign: "center" } });
            return;
        }

        const list = Array.isArray(components) ? components : [];
        const oldNorm = normalize(originalName);
        const newNorm = normalize(trimmed);

        // Build a set of existing names EXCLUDING the original name
        const existingNames = new Set(
            list
                .map((c) => (typeof c === "string" ? c : c?.name))
                .filter((n) => n != null && normalize(n) !== oldNorm)
                .map((n) => normalize(n))
        );

        if (existingNames.has(newNorm)) {
            toast.dismiss(); toast.clearWaitingQueue();
            toast.error("That component already exists.", { closeButton: true, autoClose: 1200, style: { textAlign: "center" } });
            return;
        }

        // Rename in place (support string[] or {name}[])
        const usingObjects = list.some((c) => typeof c === "object" && c !== null);

        const updated = list.map((item) => {
            const currentName = typeof item === "string" ? item : item?.name;
            if (normalize(currentName) !== oldNorm) return item; // not the one being renamed
            if (usingObjects) return { ...item, name: trimmed };
            return trimmed; // string representation
        });

        setComponents(updated);

        toast.dismiss(); toast.clearWaitingQueue();
        toast.success("Component renamed.", { closeButton: true, autoClose: 800, style: { textAlign: "center" } });

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="review-popup-overlay">
            <div className="review-popup-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Modify Component</h2>
                    <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <label className="review-date-label">Component Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Insert Component Name"
                        className="review-popup-input"
                    />
                </div>

                <div className="review-date-buttons">
                    <button onClick={submitModify} className="review-date-button">Save</button>
                </div>
            </div>
        </div>
    );
};

export default ModifyComponentName;