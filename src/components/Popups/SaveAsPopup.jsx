import React, { useEffect, useState } from "react";
import "./SaveAsPopup.css"; // Import a separate CSS file for styling
import { toast } from "react-toastify";

const SaveAsPopup = ({ onClose, saveAs, current }) => {
    const [title, setTitle] = useState(current);

    const handleTitleChange = (e) => {
        const value = e.target.value;
        setTitle(value);
    };

    const handleSave = () => {
        if (title === current) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Draft cannot have the same name as previous draft.", {
                closeButton: true,
                style: {
                    textAlign: 'center'
                },
                autoClose: 800
            });

            return;
        }
        else {
            saveAs(title);
        }
    }

    return (
        <div className="saveAs-popup-overlay">
            <div className="saveAs-popup-content">
                <div className="saveAs-date-header">
                    <h2 className="saveAs-date-title">Save Draft As</h2>
                    <button className="saveAs-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="saveAs-date-group">
                    <label className="saveAs-date-label" htmlFor="email">New Draft Title</label>
                    <span className="saveAs-date-label-tc">
                        Insert the title that should be used for the new draft that will be saved.
                    </span>
                    <textarea
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder={`Insert the new title`}
                        className="saveAs-popup-input"
                    />
                </div>

                <div className="saveAs-date-buttons">
                    <button onClick={handleSave} className="saveAs-date-button">Save Draft</button>
                </div>
            </div>
        </div>
    );
};

export default SaveAsPopup;
