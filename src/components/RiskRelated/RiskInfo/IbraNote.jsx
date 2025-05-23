
import React, { useState, useEffect } from "react";
import "./IbraNote.css"; // Add styling here

const IbraNote = ({ setClose, text }) => {
    return (
        <div className="popup-overlay-haz">
            <div className="popup-content-haz">
                <div className="review-date-header">
                    <h2 className="review-date-title">IBRA Note</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="note-table-group">
                    <label className="note-header">Note Attached for Unwanted Event</label>
                    <span className="note-text">
                        {text}
                    </span>
                </div>
            </div>
        </div>
    )
};

export default IbraNote;