const RestoreCertificatesClose = ({ closeModal, restoreSite, restoreCertificates }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Restore Site Certificates</h2>
                    <button className="review-date-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text" style={{ marginBottom: "0px" }}>{"This site might has certificates linked to it. Would you like to restore all certificates linked to this site?"}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="restore-assets-file-button-delete" onClick={restoreSite}>
                        {'Restore Site Only'}
                    </button>
                    <button className="restore-file-certificate-button-cancel" onClick={restoreCertificates}>
                        Restore Certificates
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestoreCertificatesClose;