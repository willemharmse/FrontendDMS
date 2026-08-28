// document-workflow.jsx
import React from 'react';
import './DocumentWorkflow.css';

const DocumentWorkflow = ({ setClose }) => (
    <div className="popup-overlay-document-workflow">
        <div className="popup-content-document-workflow">
            {/* — Header — */}
            <div className="review-date-header">
                <h2 className="review-date-title">Document Workflow</h2>
                <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
            </div>

            {/* — Boxed group contains subtitle, table & notes — */}
            <div className="document-workflow-group">
                <div className="docwf-container">
                    <div className="docwf-panel docwf-left">
                        <h3 className="docwf-panel-title">1. Saved Drafts Folder</h3>
                        <div className="docwf-left-content">
                            <p style={{ fontSize: "15px", fontFamily: "Arial" }}>
                                Documents that are a work in progress are displayed here.
                            </p>
                            <p style={{ fontSize: "15px", fontFamily: "Arial" }}>
                                <b>NB:</b> Documents in <b>Saved Drafts</b> must not be used for sign
                                off purposes. Once documents are ready for sign off, they must be
                                published first.
                            </p>
                        </div>
                    </div>

                    <div className="docwf-arrow">→</div>

                    <div className="docwf-panel docwf-left">
                        <h3 className="docwf-panel-title">2. Pending Sign Off</h3>
                        <div className="docwf-left-content">
                            <p style={{ fontSize: "15px", fontFamily: "Arial" }}>
                                Documents that are in the review process are displayed here. This includes new documents that are getting reviewed for sign off and documents that are in revision.
                            </p>
                            <p style={{ fontSize: "15px", fontFamily: "Arial" }}>
                                Version Numbers are allocated automatically to documents.
                            </p>
                        </div>
                    </div>

                    <div className="docwf-arrow">→</div>

                    <div className="docwf-panel docwf-left">
                        <h3 className="docwf-panel-title">3. Sign Off</h3>
                        <div className="docwf-left-content">
                            <p style={{ fontSize: "15px", fontFamily: "Arial" }}>
                                Documents that have a signed off PDF attached are displayed here.
                            </p>
                            <p style={{ fontSize: "15px", fontFamily: "Arial" }}>
                                <b>NB:</b> Documents that are getting revised are moved to the <b>Pending Sign Off</b> folder. A signed off version remains available for access in the <strong>Controlled</strong> folder with the status updated to <strong>In Revision</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="matrix-notes-document-workflow">
                    <p>
                        At any point, a document can be <b>generated as a Word file</b>, but
                        documents not generated from <strong>Pending Sign Off</strong> should not be used for
                        sign off. Once a document is generated for sign off, it should be <b>saved as a PDF,
                            signed-off and uploaded to the Document Management System (DMS)</b> to
                        ensure it is officially stored and shared.
                    </p>
                    <p style={{ marginBottom: "0px" }}>
                        <b>Note:</b> If changes are made to the <b>Word version</b> of a
                        generated document, users must <b>manually update the system</b> to
                        ensure all information is current and no data is lost.
                    </p>
                </div>
            </div>
        </div>
    </div>
);

export default DocumentWorkflow;
