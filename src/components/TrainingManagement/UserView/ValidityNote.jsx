
import React, { useState, useEffect } from "react";

const ValidityNote = ({ setClose }) => {
    return (
        <div className="popup-overlay-haz">
            <div className="popup-content-valid-ind">
                <div className="review-date-header">
                    <h2 className="review-date-title">Validity</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="validity-ind-table-group">
                    <span className="note-text" style={{ marginTop: "0px", marginBottom: "0px" }}>
                        The Validity column shows the status of a visitor induction certificate.
                        <br />
                        <br />
                        <strong>Valid: </strong><br />
                        The certificate has been obtained from completing the latest visitor induction. No later visitor inductions have been released by the site.
                        <br />
                        <br />
                        <strong>Invalid: </strong><br />
                        The certificate has been obtained from an outdated visitor induction. The visitor needs to complete the latest available visitor induction to obtain a valid certificate.
                        <br />
                        <br />
                        <strong>N/A (-): </strong><br />
                        No certificate availalbe.
                    </span>
                </div>
            </div>
        </div>
    )
};

export default ValidityNote;