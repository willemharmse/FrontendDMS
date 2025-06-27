import "./DeleteControlPopup.css";

const DeleteControlPopup = ({ closeModal, deleteControl, controlName }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-control-header">
                    <h2 className="delete-control-title">Delete Control</h2>
                    <button className="delete-control-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-control-group">
                    <div className="delete-control-text">Are you sure you want to remove this Control?<br /><strong>Note: </strong><span style={{ fontSize: "16px", fontWeight: "normal" }}>The control will also be removed from the IBRA Table.</span></div>
                    <div style={{ fontSize: "14px", fontWeight: "normal" }}>{controlName}</div>
                </div>

                <div className="delete-control-buttons">
                    <button className="delete-control-button-delete" onClick={deleteControl}>
                        Delete
                    </button>
                    <button className="delete-control-button-cancel" onClick={closeModal}>
                        Keep
                    </button>
                </div>
            </div>
        </div >
    );
};

export default DeleteControlPopup;