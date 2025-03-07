import React, { useEffect, useState } from "react";
import "./ReviewDatePopup.css"; // Import a separate CSS file for styling

const ReviewDatePopup = ({ isOpen, onClose, onUpdate, currVal }) => {
    const [reviewDateVal, setReviewDateVal] = useState("");

    useEffect(() => {
        setReviewDateVal(currVal?.toString() || "")
    }, [currVal]);

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
                headers: { "Content-Type": "application/json" },
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
                <h3 className="review-popup-title">Set Review Date Highlight Period (Days)</h3>
                <input
                    type="text"
                    value={reviewDateVal}
                    onChange={handleReviewDateChange}
                    placeholder="Enter a number"
                    className="review-popup-input"
                />
                <div className="review-popup-actions">
                    <button className="review-popup-button confirm" onClick={submitReviewDate}>
                        Submit
                    </button>
                    <button className="review-popup-button cancel" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewDatePopup;
