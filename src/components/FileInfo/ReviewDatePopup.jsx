import React, { useEffect, useState } from "react";
import "./ReviewDatePopup.css"; // Import a separate CSS file for styling

const ReviewDatePopup = ({ isOpen, onClose, onUpdate, currVal }) => {
    const [reviewDateVal, setReviewDateVal] = useState("");

    const handleReviewDateChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) { // Allow only numbers, but also allow an empty string
            setReviewDateVal(value);
        }
    };

    const submitReviewDate = async () => {
        if (!reviewDateVal || isNaN(reviewDateVal) || Number(reviewDateVal) <= 0) {
            alert("Please enter a valid number greater than 0.");
            return;
        }

        try {
            await fetch(`${process.env.REACT_APP_URL}/api/valuesUpload/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ reviewDate: Number(reviewDateVal) }),
            });
            onUpdate(Number(reviewDateVal)); // Update parent component state
            onClose();
        } catch (error) {
            console.error("Failed to update review date:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="review-popup-overlay">
            <div className="review-popup-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Highlight Review Dates</h2>
                    <button className="review-date-close" onClick={onClose}>×</button>
                </div>

                <div className="review-date-group">
                    <label className="review-date-label" htmlFor="email">Review Date Alert Threshold (X Days)</label>
                    <span className="review-date-label-tc">
                        Set the number of days (X) before a scheduled review date when highlighting should begin.
                        The review date will be highlighted yellow if it falls within X days from today, and red if it has already passed.
                    </span>
                    <input
                        type="text"
                        value={reviewDateVal}
                        onChange={handleReviewDateChange}
                        placeholder="Insert Number of Days"
                        className="review-popup-input"
                    />
                </div>

                <div className="review-date-buttons">
                    <button onClick={submitReviewDate} className="review-date-button">Submit</button>
                </div>
            </div>
        </div>
    );
};

export default ReviewDatePopup;
