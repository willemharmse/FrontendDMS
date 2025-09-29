import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

const RenameSite = ({ isOpen, onClose, siteName, siteId }) => {
    const [newName, setNewName] = useState(siteName);
    const [sites, setSites] = useState([]);

    const handleNameChange = (e) => setNewName(e.target.value);

    useEffect(() => {
        const fetchValues = async () => {
            try {
                // ⬇️ include deleted so we can validate against those names too
                const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getUploadSites?includeDeleted=true`);
                if (!response.ok) throw new Error("Failed to fetch sites");
                const data = await response.json();

                // exclude the current site’s own name (you’re renaming it)
                const filtered = (data?.sites ?? []).filter(s => s?.site !== siteName);

                // sort defensively
                const sorted = filtered.sort((a, b) => (a?.site || '').localeCompare(b?.site || ''));
                setSites(sorted);
            } catch (error) {
                console.log(error.message);
            }
        };
        fetchValues();
    }, [siteName]);

    const nameClash = (name) => {
        const target = (name || '').trim().toLowerCase();
        if (!target) return { active: false, deleted: false };

        let active = false;
        let deleted = false;

        for (const s of sites) {
            const n = (s?.site || '').toLowerCase();
            if (n === target) {
                if (s?.deleted === true) deleted = true;       // explicit deleted sites
                else active = true;                             // active or legacy docs with no deleted flag
            }
            if (active && deleted) break;
        }
        return { active, deleted };
    };

    const submitReviewDate = async () => {
        const trimmed = (newName || '').trim();

        if (!trimmed) {
            toast.dismiss(); toast.clearWaitingQueue();
            toast.error("Please enter a valid site name.", {
                closeButton: false, autoClose: 2000, style: { textAlign: 'center' }
            });
            return;
        }

        const { active, deleted } = nameClash(trimmed);

        if (deleted) {
            toast.dismiss(); toast.clearWaitingQueue();
            toast.error(`${newName} previously existed in the system. Please restore or contact the system administrator.`, {
                closeButton: false, autoClose: 2000, style: { textAlign: 'center' }
            });
            return;
        }

        if (active) {
            toast.dismiss(); toast.clearWaitingQueue();
            toast.error("Site name is already used.", {
                closeButton: false, autoClose: 2000, style: { textAlign: 'center' }
            });
            return;
        }

        try {
            await fetch(`${process.env.REACT_APP_URL}/api/flameproof/renameSite/${siteId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ newName: trimmed }),
            });

            toast.dismiss(); toast.clearWaitingQueue();
            toast.success("Successfully renamed site.", {
                closeButton: false, autoClose: 2000, style: { textAlign: 'center' }
            });

            setNewName("");
            onClose();
        } catch (error) {
            toast.dismiss(); toast.clearWaitingQueue();
            toast.error("Could not rename site.", {
                closeButton: false, autoClose: 2000, style: { textAlign: 'center' }
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="review-popup-overlay">
            <div className="review-popup-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Rename Site</h2>
                    <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <label className="review-date-label">New Site Name</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={handleNameChange}
                        placeholder="Insert New Site Name"
                        className="review-popup-input"
                    />
                </div>

                <div className="review-date-buttons">
                    <button onClick={submitReviewDate} className="review-date-button">Rename</button>
                </div>
            </div>
        </div>
    );
};

export default RenameSite;
