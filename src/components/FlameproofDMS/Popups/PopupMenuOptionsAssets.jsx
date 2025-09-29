import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const PopupMenuOptionsAssets = ({ isOpen, setHoveredFileId, openModifyModal, file, canIn, access }) => {
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
        <div className="popup-menu-container-FI" style={{ left: "15px" }}>
            {isOpen && (
                <div
                    className={`popup-content-FI ${position === "above" ? "popup-above" : "popup-below"}`}
                    ref={popupRef}
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
                    <ul>
                        <li onClick={() => navigate(`/FrontendDMS/flameManageSub/${file.assetNr}/${file._id}`)}>View Certificates</li>
                    </ul>
                    {canIn(access, "FCMS", ["systemAdmin"]) && (<ul>
                        <li onClick={() => openModifyModal(file._id)}>Update Components</li>
                    </ul>)}
                </div>
            )}
        </div>
    );
};

export default PopupMenuOptionsAssets;