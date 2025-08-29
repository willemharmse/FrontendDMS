const DeleteAsset = ({ closeModal, asset, deleteAsset }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Delete Asset</h2>
                    <button className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">{"Are you sure you want to delete this asset?"}</div>
                    <div>{asset.assetNr}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete" onClick={deleteAsset}>
                        {'Delete'}
                    </button>
                    <button className="delete-file-button-cancel" onClick={closeModal}>
                        Keep
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAsset;