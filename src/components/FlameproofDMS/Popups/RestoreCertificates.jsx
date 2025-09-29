const RestoreCertificates = ({ closeModal, restoreCertificates }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Restore Site Certificates</h2>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text" style={{ marginBottom: "0px" }}>{"This site has certificates linked to it. Would you like to restore the certificates as well?"}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="restore-assets-file-button-delete" onClick={closeModal}>
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

export default RestoreCertificates;