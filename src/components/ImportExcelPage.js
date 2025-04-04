import react, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import CSS for styling
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import "./ImportExcelPage.css"

export default function ImportExcelPage() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [file, setFile] = useState(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        navigate('/FrontendDMS/');
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })
            return;
        }

        const formData = new FormData();
        formData.append("excel", file);

        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/test/upload-excel/`, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                toast.success("Values have been successfully imported", {
                    closeButton: false,
                    autoClose: 800,
                    style: {
                        textAlign: 'center'
                    }
                })
            } else {
                toast.error(`Error: ${result.error}`, {
                    closeButton: false,
                    autoClose: 800,
                    style: {
                        textAlign: 'center'
                    }
                })
            }

            setLoading(false);
        } catch (error) {
            setLoading(false);
            toast.error("Error has occured", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })
        }
    };

    return (
        <div className="import-page-container">
            <button className="logo-button-import" onClick={() => navigate('/FrontendDMS/home')}>
                <img src="logo.webp" alt="Home" />
            </button>
            <button className="log-button-import" onClick={handleLogout}>
                Log Out
            </button>
            <button className="temp-button-import" onClick={() => {
                const link = document.createElement("a");
                link.href = "/template.xlsx"; // Path to your file
                link.download = "template.xlsx"; // Suggested download name
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }}>
                Download Template
            </button>
            <button className="back-button-import" onClick={() => navigate(-1)}>
                Back
            </button>

            <div className="import-box">
                <h2>Import Values</h2>

                {/* Excel File Upload */}
                <div className="form-group-import">
                    <label>Upload Excel File <span className="required-field">*</span></label>
                    <div className="custom-file-input-import">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                        />
                        <label>Choose Excel File</label>
                        {file && <span className="file-name-import">{file.name}</span>}
                    </div>
                </div>

                {/* Upload Button */}
                <button
                    className="subBut-import"
                    onClick={handleUpload}
                    disabled={loading}
                    title="Enter all fields marked by a * to submit the form"
                >
                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Import Values For Upload Page'}
                </button>
            </div>
            <ToastContainer />
        </div>
    );
}
