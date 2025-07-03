import React, { useEffect, useState } from "react";
import "./RenameDocument.css"; // Import a separate CSS file for styling
import { ToastContainer, toast } from "react-toastify";

const RenameDocument = ({ isOpen, onClose, documentName, fileID }) => {


    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    const [newName, setNewName] = useState(removeFileExtension(documentName));

    const handleNameChange = (e) => {
        setNewName(e.target.value);
    };

    const submitReviewDate = async () => {
        if (!newName.trim()) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("Please enter a valid document name.", {
                closeButton: false,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        try {
            await fetch(`${process.env.REACT_APP_URL}/api/file/renameDocument`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ newName: newName.trim(), id: fileID }),
            });

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Successfully renamed document.", {
                closeButton: false,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });

            onClose();
        } catch (error) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Could not rename document.", {
                closeButton: false,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="review-popup-overlay">
            <div className="review-popup-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Rename Document</h2>
                    <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <label className="review-date-label" htmlFor="email">New Document Name</label>
                    <span className="review-date-label-tc">
                        Ensure the format is as follows: Title Type Version.
                    </span>
                    <input
                        type="text"
                        value={newName}
                        onChange={handleNameChange}
                        placeholder="Insert New Document Name"
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

export default RenameDocument;
