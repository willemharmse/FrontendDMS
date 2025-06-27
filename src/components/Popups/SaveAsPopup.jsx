import React, { useEffect, useState } from "react";
import "./SaveAsPopup.css"; // Import a separate CSS file for styling

const SaveAsPopup = ({ onClose, saveAs, current }) => {
    const [title, setTitle] = useState(current);

    const handleTitleChange = (e) => {
        const value = e.target.value;
        setTitle(value);
    };

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
                        Enter the title that should be used for the new draft that will be saved.
                    </span>
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder={`Enter the new title`}
                        className="saveAs-popup-input"
                    />
                </div>

                <div className="saveAs-date-buttons">
                    <button onClick={() => saveAs(title)} className="saveAs-date-button">Save Draft</button>
                </div>
            </div>
        </div>
    );
};

export default SaveAsPopup;
