import React, { useState, useRef, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import ComponentDateUpdates from './ComponentDateUpdates';
import DatePicker from 'react-multi-date-picker';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import "./UpdateCertificateModal.css"

const UpdateCertificateModal = ({ isModalOpen, closeModal, certificateID, refresh }) => {
    const [newFile, setNewFile] = useState(null);
    const [issueDate, setIssueDate] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [certificateNumber, setCertificateNumber] = useState("");
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [userID, setUserID] = useState("");
    const fileInputRef = useRef(null);
    const [chosenFileName, setChosenFileName] = useState("");
    const [modalHeight, setModalHeight] = useState(400); // Initial modal height, adjust if needed
    const [assetID, setAssetID] = useState("");
    const navigate = useNavigate();
    const [confirmNavigation, setConfirmNavigation] = useState(false);
    const [certifiers, setCertifiers] = useState([]);
    const [certificationBody, setCertificationBody] = useState("");

    const fetchCertifiers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/getCertifiers`);
            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }
            const data = await response.json();

            setCertifiers(data.certifiers);
        } catch (error) {
            setError(error.message);
        }
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    useEffect(() => {
        if (isModalOpen) {
            let newHeight = 500;

            if (removeFileExtension(chosenFileName).length > 67) {
                newHeight += 13;
            }
            if (newFile && removeFileExtension(newFile.name).length > 67) {
                newHeight += 13;
            }

            setModalHeight(newHeight);
        }
    }, [isModalOpen, chosenFileName, newFile]);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, []);

    const isFormValid = () => {
        return newFile && issueDate && certificateNumber && certificationBody;
    };

    const handleFileSelect = (selectedFile) => {
        if (selectedFile) {
            setNewFile(selectedFile);
        }
    };

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getCerts`);
                if (!response.ok) {
                    throw new Error("Failed to fetch files");
                }
                const data = await response.json();
                const matchedFile = data.certificates?.find(file => file._id === certificateID);
                console.log(data.certificates)
                if (matchedFile) {
                    setChosenFileName(removeFileExtension(matchedFile.fileName));
                }
                setCertificateNumber(matchedFile.certNr)
                setCertificationBody(matchedFile.certAuth)
            } catch (err) {
                setError(err.message);
            }
        };
        fetchFiles();
        fetchCertifiers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isFormValid()) {
            toast.error("Please fill in all required fields", {
                closeButton: false,
                autoClose: 2000,
                style: {
                    textAlign: 'center'
                }
            })

            return;
        }

        const formData = new FormData();
        formData.append("newFile", newFile);
        formData.append("issueDate", issueDate);
        formData.append("expiryDate", expiryDate);
        formData.append("certificateNumber", certificateNumber);
        formData.append("certificationBody", certificationBody);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/update/${certificateID}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData,
            });
            if (!response.ok) {
                throw new Error("Upload failed");
            }
            const data = await response.json();

            setAssetID(data.assetID);

            setNewFile(null);
            setIssueDate("");
            setExpiryDate("");
            setCertificateNumber("");
            setCertificationBody("");
            setError(null);

            toast.success("Certificate version updated successfully!", {
                closeButton: false,
                autoClose: 2000,
                style: {
                    textAlign: 'center'
                }
            });

            setConfirmNavigation(true);
        } catch (err) {
            setError(err.message);
            setSuccessMsg("");
        }
    };

    const handleNavigateUpdate = () => {
        setConfirmNavigation(false);
        navigate(`/FrontendDMS/flameComponents/${assetID}`);
    }

    const handleNavigateNormal = () => {
        setConfirmNavigation(false);
        closeModalAdd();
        refresh();
    }

    const handleChooseFile = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const closeModalAdd = () => {
        setNewFile("");
        setIssueDate("");
        closeModal();
    };

    const todayString = () => {
        const d = new Date();
        // shift for timezone so the ISO date matches local date
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    };

    if (!isModalOpen) return null;

    return (
        <div className="update-cert-updated-overlay">
            <div className="update-cert-updated-modal" style={{ height: `${modalHeight}px`, maxHeight: `${modalHeight}px` }}>
                <div className="update-cert-updated-header">
                    <h2 className="update-cert-updated-title">Replace Certificate</h2>
                    <button className="update-cert-updated-close" onClick={closeModalAdd} title="Close Popup">×</button>
                </div>

                <form onSubmit={handleSubmit} className='update-cert-form'>
                    <div className="update-cert-scroll-area">
                        <div className="update-cert-updated-group-top">
                            <label className="update-cert-updated-label">Chosen Certificate</label>
                            <p className="update-cert-updated-label-file-name-top">
                                {chosenFileName || "No Certificate Selected"}
                            </p>
                        </div>

                        <div className="update-cert-updated-group">
                            <label className="update-cert-updated-label">Select New Certificate <span className="ump-required">*</span></label>
                            <p className="update-cert-updated-label-file-name">
                                {newFile ? newFile.name : "No Certificate Selected"}
                            </p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="upload-file-page-file-input"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <div className="update-file-buttons">
                                <button
                                    type="button"
                                    className="update-file-button-select-file"
                                    onClick={handleChooseFile}
                                >
                                    Choose Certificate
                                </button>
                            </div>
                        </div>

                        <div className="side-by-side-container">
                            <div className="update-cert-updated-side">
                                <label className="update-file-label">Certification Body <span className="ump-required">*</span></label>
                                <div className="update-cert-updated-select-container">
                                    <select
                                        value={certificationBody}
                                        onChange={(e) => setCertificationBody(e.target.value)}
                                        className="upm-comp-input-select font-fam"
                                        style={{ color: certificationBody === "" ? "GrayText" : "black" }}
                                    >
                                        <option value="" className="def-colour">Select Certification Body</option>
                                        {certifiers.map(s => (
                                            <option key={s._id} value={s.authority} className="norm-colour">
                                                {s.authority}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="side-by-side-container">
                            <div className="update-cert-updated-side">
                                <label className="update-file-label">Certificate Number <span className="ump-required">*</span></label>

                                <div className='update-file-input-file-container' style={{ position: "relative" }}>
                                    <input
                                        type="text"
                                        name="assetNr"
                                        value={certificateNumber}
                                        onChange={(e) => setCertificateNumber(e.target.value)}
                                        autoComplete="off"
                                        className="ump-input-select font-fam"
                                        placeholder="Insert Certificate Number"
                                    />
                                </div>
                            </div>
                        </div>


                        <div className="side-by-side-container">
                            <div className="update-cert-updated-side">
                                <label className="update-file-label">Issue Date <span className="ump-required">*</span></label>

                                <div className='update-file-input-file-container' style={{ position: "relative" }}>
                                    <DatePicker
                                        value={issueDate || ""}
                                        format="YYYY-MM-DD"
                                        onChange={(val) => {
                                            const v = val?.format("YYYY-MM-DD");
                                            setIssueDate(v); // clamp to today if future picked/typed
                                        }}
                                        rangeHover={false}
                                        highlightToday={false}
                                        editable={false}
                                        placeholder="YYYY-MM-DD"
                                        hideIcon={false}
                                        inputClass='update-file-input-file-new'
                                        maxDate={todayString()}
                                        onOpenPickNewDate={false}
                                    />
                                    <FontAwesomeIcon
                                        icon={faCalendarDays}
                                        className="date-input-calendar-icon"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="side-by-side-container">
                            <div className="update-cert-updated-side">
                                <label className="update-file-label">Expiry Date</label>

                                <div className='update-file-input-file-container' style={{ position: "relative" }}>
                                    <DatePicker
                                        value={expiryDate || ""}
                                        format="YYYY-MM-DD"
                                        onChange={(val) => {
                                            const v = val?.format("YYYY-MM-DD");
                                            setExpiryDate(v); // clamp to today if future picked/typed
                                        }}
                                        rangeHover={false}
                                        highlightToday={false}
                                        editable={false}
                                        placeholder="YYYY-MM-DD"
                                        hideIcon={false}
                                        inputClass='update-file-input-file-new'
                                        minDate={todayString()}
                                        onOpenPickNewDate={false}
                                    />
                                    <FontAwesomeIcon
                                        icon={faCalendarDays}
                                        className="date-input-calendar-icon"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="update-cert-updated-buttons">
                        <button type="submit" className="update-file-button">Submit</button>
                    </div>
                </form>
            </div>

            {confirmNavigation && (<ComponentDateUpdates closeModal={handleNavigateNormal} navigateToPage={handleNavigateUpdate} />)}
        </div>
    );
};

export default UpdateCertificateModal;