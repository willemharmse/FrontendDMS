import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const PopupMenuTasks = ({ isOpen, setHoveredId, hoveredId, file, allowed }) => {
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
        <div className="popup-menu-container-FI" style={{ marginTop: "30px" }}>
            <div className="popup-menu-container-pub-files">
                {(isOpen && allowed) && (
                    <div className="popup-content-pub-files"
                        onMouseEnter={() => setHoveredId(file._id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        <ul>
                            <li onClick={() => navigate(`/FrontendDMS/manual-tasks-history/${file._id}`)}>Version History</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PopupMenuTasks;