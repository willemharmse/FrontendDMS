import React, { useEffect, useState } from "react";
import "./DownloadPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const BatchDownloadPopup = ({ closeDownloadModal, confirmDownload, downloadFileName, loading, selectedCount = 0 }) => {
    return (
        <div className="download-popup-overlay">
            <div className="download-popup-content">
                <div className="download-file-header">
                    <h2 className="download-file-title">Download Files</h2>
                    <button className="download-file-close" onClick={closeDownloadModal} disabled={loading} title="Close Popup">×</button>
                </div>

                <div className="download-file-group">
                    <div className="download-file-text">Do you want to download the selected files?</div>
                    <div>{selectedCount} document{selectedCount === 1 ? "" : "s"} will be packaged into a single ZIP file.</div>
                </div>

                <div className="download-file-buttons">
                    <button className="download-file-button-download" onClick={confirmDownload} disabled={loading}>
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Download'}
                    </button>
                    <button className="download-file-button-cancel" onClick={closeDownloadModal} disabled={loading}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BatchDownloadPopup;