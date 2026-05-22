import React, { useEffect, useState } from "react";

const TaskDueDatePopup = ({ isOpen, onClose, onUpdate, currVal }) => {
    const [dueDateVal, setDueDateVal] = useState("30");

    useEffect(() => {
        if (isOpen) {
            const savedValue = localStorage.getItem("highlightTaskDueDates");
            if (savedValue && !isNaN(savedValue) && Number(savedValue) > 0) {
                setDueDateVal(savedValue);
            } else if (currVal && !isNaN(currVal) && Number(currVal) > 0) {
                setDueDateVal(String(currVal));
            } else {
                setDueDateVal("30");
            }
        }
    }, [isOpen, currVal]);

    const handleChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setDueDateVal(value);
        }
    };

    const handleSubmit = () => {
        if (!dueDateVal || isNaN(dueDateVal) || Number(dueDateVal) <= 0) {
            alert("Please enter a valid number greater than 0.");
            return;
        }
        const parsed = Number(dueDateVal);
        localStorage.setItem("highlightTaskDueDates", String(parsed));
        onUpdate(parsed);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="review-popup-overlay">
            <div className="review-popup-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Highlight Task Due Dates</h2>
                    <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <label className="review-date-label">Task Due Date Alert Threshold (X Days)</label>
                    <span className="review-date-label-tc">
                        Set the number of days (X) before a task due date when highlighting should begin.
                        The due date will be highlighted yellow if it falls within X days from today, and red if it has already passed.
                    </span>
                    <input
                        type="text"
                        value={dueDateVal}
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

export default TaskDueDatePopup;
