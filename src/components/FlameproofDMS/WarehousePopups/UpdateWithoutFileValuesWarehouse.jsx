const UpdateWithoutFileValuesWarehouse = ({ closeModal, submit }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Submit</h2>
                    <button className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text" style={{ marginBottom: "0px", paddingLeft: "5px", paddingRight: "5px" }}>{`Are you sure you want to update component without entering flameproof certificate details?`}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete" onClick={() => submit(true)}>
                        {'Yes'}
                    </button>
                    <button className="delete-file-button-cancel" onClick={() => submit(false)}>
                        No
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateWithoutFileValuesWarehouse;