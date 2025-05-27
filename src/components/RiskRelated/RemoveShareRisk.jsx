import React, { useEffect, useState } from "react";
import "./RemoveShareRisk.css";

const RemoveShareRisk = ({ handleConfirmRemoval, handleCancelRemoval, user, setRemove }) => {
    return (
        <div className="delete-popup-overlay-sr">
            <div className="delete-popup-content-sr">
                <div className="delete-file-header-sr">
                    <h2 className="delete-file-title-sr">Remove Share User</h2>
                    <button className="delete-file-close-sr" onClick={() => setRemove(false)} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group-sr">
                    <div className="delete-file-text-sr">{"Do you want to remove the user from share list?"}</div>
                    <div>{user}</div>
                </div>

                <div className="delete-file-buttons-sr">
                    <button className="delete-file-button-delete-sr" onClick={() => handleConfirmRemoval()}>
                        {"Remove"}
                    </button>
                    <button className="delete-file-button-cancel-sr" onClick={() => handleCancelRemoval()}>
                        Keep
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RemoveShareRisk;