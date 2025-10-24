import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import axios from "axios";

const AudioPicker = ({ onClose, module, topic, slide, changeMedia }) => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState([]);
    const [userID, setUserID] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);

            setUserID(decodedToken.userId);
        }
    }, []);

    const handleClick = () => {
        if (!isFormValid()) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: false,
                autoClose: 2000,
                style: {
                    textAlign: 'center'
                }
            })
        } else {
            handleUpload();  // Call your function when the form is valid
        }
    };

    const isFormValid = () => {
        return file;
    };

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setMessage("");
        setErrors([]);
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage("Please select an audio file.");
            return;
        }

        setLoading(true);

        try {
            changeMedia(module, topic, slide, 10, file);

            setErrors([]);
            setFile(null);
            toast.success("Audio File Uploaded.", {
                closeButton: false,
                autoClose: 2000,
                style: {
                    textAlign: 'center'
                }
            })

            setLoading(false);

            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            toast.error("Could not upload audio file.", {
                closeButton: false,
                autoClose: 2000,
                style: {
                    textAlign: 'center'
                }
            });
        }
    };

    return (
        <div className="batch-popup-overlay-assets">
            <div className="batch-popup-content-assets">
                <div className="batch-file-header">
                    <h2 className="batch-file-title">Upload Audio</h2>
                    <button className="batch-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="batch-file-group-assets">
                    <div className="batch-file-text">Add Audio to this Slide</div>
                    <div className="batch-file-text-xlsx">{file ? file.name : "No File Selected"}</div>
                    <div className="batch-file-buttons">
                        <label className="batch-file-button">
                            {'Choose Audio File'}
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                </div>

                <div className="batch-file-buttons">
                    <button className="batch-file-button-sub" disabled={loading} onClick={() => handleClick()}>
                        {loading ? <FontAwesomeIcon icon={faSpinner} className="spin-animation" /> : 'Upload'}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default AudioPicker;