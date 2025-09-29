import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const AddComponent = ({ isOpen, onClose, setComponents, components }) => {
    const [componentName, setComponentName] = useState("");

    const normalize = (s) => String(s || "").trim().toLowerCase();

    const submitAdd = () => {
        const name = componentName.trim();
        if (!name) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please enter a valid component name.", {
                closeButton: true,
                autoClose: 800,
                style: { textAlign: "center" },
            });
            return;
        }

        const list = Array.isArray(components) ? components : [];
        const existingNames = new Set(
            list.map((c) => normalize(typeof c === "string" ? c : c?.name))
        );

        if (existingNames.has(normalize(name))) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("That component already exists.", {
                closeButton: true,
                autoClose: 1200,
                style: { textAlign: "center" },
            });
            return;
        }

        // Add: preserve current shape (strings vs {name}),
        // but include a client id if using objects.
        const usingObjects = list.some((c) => typeof c === "object" && c !== null);
        const newItem = usingObjects
            ? { _id: crypto?.randomUUID?.() || Date.now().toString(), name }
            : name;

        setComponents((prev) => [...(prev || []), newItem]);
        setComponentName("");

        toast.dismiss();
        toast.clearWaitingQueue();
        toast.success("New component added.", {
            closeButton: true,
            autoClose: 800,
            style: { textAlign: "center" },
        });

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="review-popup-overlay">
            <div className="review-popup-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Add New Component</h2>
                    <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <label className="review-date-label">New Component Name</label>
                    <input
                        type="text"
                        value={componentName}
                        onChange={(e) => setComponentName(e.target.value)}
                        placeholder="Insert Component Name"
                        className="review-popup-input"
                    />
                </div>

                <div className="review-date-buttons">
                    <button onClick={submitAdd} className="review-date-button">Add Component</button>
                </div>
            </div>
        </div>
    );
};

export default AddComponent;
