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
                            <p style={{ fontSize: "14px" }}>
                                Newly created documents and documents that are a work in progress are
                                displayed here. Users can share and collaborate on these documents.
                            </p>
                            <p style={{ fontSize: "14px" }}>
                                <b>NB:</b> Documents in <b>Saved Drafts</b> must not be used for sign
                                off purposes. Once documents are ready for sign off, they must be
                                published first.
                            </p>
                        </div>
                    </div>

                    <div className="docwf-arrow">→</div>

                    <div className="docwf-panel docwf-right">
                        <h3 className="docwf-panel-title">2. Published Documents Folder</h3>
                        <p style={{ fontSize: "14px", marginTop: "0px" }}>
                            Documents that are ready for sign off are displayed here. Version
                            numbers are allocated automatically to documents.
                        </p>

                        <div className="docwf-review">
                            <h4 className="docwf-review-title">Review Process</h4>
                            <div className="docwf-review-flow">
                                <img src={`${process.env.PUBLIC_URL}/workflow.png`} />
                            </div>
                        </div>

                        <p style={{ fontSize: "14px", marginBottom: "0px" }}>
                            Published documents contain revision history. If time has come for a
                            document to be reviewed, the user is presented with the option. If a
                            published document is in review, it is marked by an <b>In Review</b>{" "}
                            status highlighted in yellow. Once the review process is complete,
                            users can publish the document again and a new version number will be
                            allocated to the document.
                        </p>
                    </div>
                </div>

                <div className="matrix-notes-document-workflow">
                    <p>
                        At any point, a document can be <b>generated as a Word file</b>, but
                        documents not generated from published documents should not be used for
                        sign off. Once a document is published, it should be <b>saved as a PDF,
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
