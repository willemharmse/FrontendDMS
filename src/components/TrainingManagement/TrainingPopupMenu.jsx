import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const TrainingPopupMenu = ({ isOpen, setHoveredCourseCode, course }) => {
    const navigate = useNavigate();
    const popupRef = useRef(null);
    const [position, setPosition] = useState("below");

    useEffect(() => {
        if (isOpen && popupRef.current) {
            const rect = popupRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.top;
            const spaceAbove = rect.top;

            // If not enough space below and more above, show above
            if (spaceBelow < rect.height + 20 && spaceAbove > rect.height) {
                setPosition("above");
            } else {
                setPosition("below");
            }
        }
    }, [isOpen]);

    return (
        <div className="popup-menu-container-FI">
            {isOpen && (
                <div
                    className={`popup-content-FI ${position === "above" ? "popup-above" : "popup-below"}`}
                    ref={popupRef}
                    onMouseEnter={() => setHoveredCourseCode(course.courseCode)}
                    onMouseLeave={() => setHoveredCourseCode(null)}
                >
                    <ul>
                        <li onClick={() => navigate(`/courseDetails/${course.courseCode}`)}>View Course</li>
                    </ul>
                    <ul>
                        <li>Manage Trainees</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default TrainingPopupMenu;