import React, { useEffect, useState } from "react";

const CertExpiryDatePopup = ({ isOpen, onClose, onUpdate, currVal }) => {
    const [expiryDateVal, setExpiryDateVal] = useState("30");

    useEffect(() => {
        if (isOpen) {
            const savedValue = localStorage.getItem("highlightCertExpiryDates");
            if (savedValue && !isNaN(savedValue) && Number(savedValue) > 0) {
                setExpiryDateVal(savedValue);
            } else if (currVal && !isNaN(currVal) && Number(currVal) > 0) {
                setExpiryDateVal(String(currVal));
            } else {
                setExpiryDateVal("30");
            }
        }
    }, [isOpen, currVal]);

    const handleChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setExpiryDateVal(value);
        }
    };

    const handleSubmit = () => {
        if (!expiryDateVal || isNaN(expiryDateVal) || Number(expiryDateVal) <= 0) {
            alert("Please enter a valid number greater than 0.");
            return;
        }
        const parsed = Number(expiryDateVal);
        localStorage.setItem("highlightCertExpiryDates", String(parsed));
        onUpdate(parsed);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="review-popup-overlay">
            <div className="review-popup-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Highlight Certificate Expiry Dates</h2>
                    <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <label className="review-date-label">Certificate Expiry Alert Threshold (X Days)</label>
                    <span className="review-date-label-tc">
                        Set the number of days (X) before a certificate expiry date when highlighting should begin.
                        The expiry date will be highlighted yellow if it falls within X days from today, and red if it has already passed.
                    </span>
                    <input
                        type="text"
                        value={expiryDateVal}
                        onChange={handleChange}
                        placeholder="Insert Number of Days"
                        className="review-popup-input"
                    />
                </div>

                <div className="review-date-buttons">
                    <button onClick={handleSubmit} className="review-date-button">Submit</button>
                </div>
            </div>
        </div>
    );
};

export default CertExpiryDatePopup;
