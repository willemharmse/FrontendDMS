import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const AddAssetType = ({ isOpen, onClose }) => {
    const [assetName, setAssetName] = useState("");

    const submitSiteAdd = async () => {
        const name = assetName.trim();
        if (!name) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please enter a valid asset type name.", {
                closeButton: true,
                autoClose: 800,
                style: { textAlign: "center" },
            });
            return;
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/addAssetType`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ typeName: name }),
            });

            const isJson = res.headers.get("content-type")?.includes("application/json");
            const data = isJson ? await res.json() : null;

            if (!res.ok) {
                const msg = data?.error || data?.message || `Request failed (${res.status})`;
                throw new Error(msg);
            }

            setAssetName("");
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("New asset type added successfully", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: "center" },
            });

            onClose();
        } catch (error) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(error.message || "Failed to add site.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: "center" },
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="review-popup-overlay">
            <div className="review-popup-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Add New Asset Type</h2>
                    <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <label className="review-date-label">New Asset Type</label>
                    <input
                        type="text"
                        value={assetName}
                        onChange={(e) => setAssetName(e.target.value)}
                        placeholder="Insert Asset Type"
                        className="review-popup-input"
                    />
                </div>

                <div className="review-date-buttons">
                    <button onClick={submitSiteAdd} className="review-date-button">Add Asset Type</button>
                </div>
            </div>
        </div>
    );
};

export default AddAssetType;
