import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import RestoreSite from "./RestoreSite";
import RestoreCertificates from "./RestoreCertificates";

const AddSite = ({ isOpen, onClose }) => {
    const [siteName, setSiteName] = useState("");
    const [askRestore, setAskRestore] = useState(false);
    const [restoreCertificates, setRestoreCertificates] = useState(false);
    const [restoreID, setRestoreID] = useState("")

    const restoreSite = () => {
        setRestoreCertificates(true);
        setAskRestore(false);
    }

    const closeRestoreCerts = async () => {
        setRestoreCertificates(false);

        if (!restoreID) {
            onClose();
            return;
        }

        try {
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/flameproof/sites/${restoreID}/restore`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const isJson = res.headers.get("content-type")?.includes("application/json");
            const data = isJson ? await res.json() : null;

            if (!res.ok) {
                const msg = data?.error || data?.message || `Request failed (${res.status})`;
                throw new Error(msg);
            }

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Site restored without certificates.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: "center" },
            });

            setSiteName("");
            setAskRestore(false);
            setRestoreID("");
            onClose();
        } catch (err) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(err.message || "Failed to restore site.", {
                closeButton: true,
                autoClose: 1800,
                style: { textAlign: "center" },
            });
            onClose();
        }
    };

    const restoreSiteAndCertificates = async () => {
        if (!restoreID) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Missing site id to restore.", {
                closeButton: true,
                autoClose: 1400,
                style: { textAlign: "center" },
            });
            return;
        }

        try {
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/flameproof/sites/${restoreID}/restore-active-certificates`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const isJson = res.headers.get("content-type")?.includes("application/json");
            const data = isJson ? await res.json() : null;

            if (!res.ok && res.status !== 207) {
                const msg = data?.error || data?.message || `Request failed (${res.status})`;
                throw new Error(msg);
            }

            // success or partial success
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Certificates restored with site.",
                { closeButton: true, autoClose: 1800, style: { textAlign: "center" } }
            );

            setSiteName("");
            setAskRestore(false);
            setRestoreCertificates(false);
            setRestoreID("");
            onClose();
        } catch (err) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(err.message || "Failed to restore site and certificates.", {
                closeButton: true,
                autoClose: 1800,
                style: { textAlign: "center" },
            });
        }
    };

    const submitSiteAdd = async () => {
        const name = siteName.trim();
        if (!name) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please enter a valid site name.", {
                closeButton: true,
                autoClose: 800,
                style: { textAlign: "center" },
            });
            return;
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/addSite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ siteName: name }),
            });

            const isJson = res.headers.get("content-type")?.includes("application/json");
            const data = isJson ? await res.json() : null;

            if (!res.ok) {
                const msg = data?.error || data?.message || `Request failed (${res.status})`;
                throw new Error(msg);
            }

            if (res.ok) {
                if (data.deleted === true) {
                    setAskRestore(true);
                    setRestoreID(data.id);
                    return;
                }
            }

            setSiteName("");

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("New site added successfully", {
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
                    <h2 className="review-date-title">Add New Site</h2>
                    <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <label className="review-date-label">New Site Name</label>
                    <input
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        placeholder="Insert Site Name"
                        className="review-popup-input"
                    />
                </div>

                <div className="review-date-buttons">
                    <button onClick={submitSiteAdd} className="review-date-button">Add Site</button>
                </div>
            </div>

            {askRestore && (<RestoreSite closeModal={() => setAskRestore(false)} siteName={siteName} restoreSite={restoreSite} />)}
            {restoreCertificates && (<RestoreCertificates closeModal={closeRestoreCerts} restoreCertificates={restoreSiteAndCertificates} />)}
        </div>
    );
};

export default AddSite;
