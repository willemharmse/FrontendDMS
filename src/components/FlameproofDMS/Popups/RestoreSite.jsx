const RestoreSite = ({ closeModal, siteName, restoreSite }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Restore Site</h2>
                    <button className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text" style={{ marginBottom: "0px" }}>{`${siteName} previously existed in the system. Please restore or contact the system administrator.`}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete" onClick={closeModal}>
                        {'Cancel'}
                    </button>
                    <button className="delete-file-button-cancel" onClick={restoreSite}>
                        Restore
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestoreSite;