import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Tester = () => {
    const [file, setFile] = useState(null);
    const [pdfUrl, setPdfUrl] = useState("");
    const navigate = useNavigate();

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post("http://localhost:5000/api/docCreate/upload-docx", formData, {
                responseType: "blob", // Important to handle the PDF file
            });

            const pdfBlob = new Blob([response.data], { type: "application/pdf" });
            const pdfUrl = URL.createObjectURL(pdfBlob);
            setPdfUrl(pdfUrl);
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to generate PDF.");
        }
    };

    return (
        <div className="pdf-info-container">
            <div className="sidebar">
                <div className="sidebar-logo">
                    <img src="/logo.webp" alt="Logo" className="logo-img" onClick={() => navigate('/home')} />
                </div>
                <button className="sidebar-item text-format-log log-but" onClick={() => navigate('/')}>
                    Log Out
                </button>
            </div>

            <div className="main-box-preview">
                <div className="file-preview-container">
                    <h2>DOCX to PDF Converter</h2>
                    <input type="file" accept=".docx" onChange={handleFileChange} />
                    <button onClick={handleUpload} className="upload-button">Upload & Convert</button>

                    {pdfUrl && (
                        <div className="pdf-download-container">
                            <h3>Download PDF:</h3>
                            <a href={pdfUrl} download="converted.pdf">
                                <button className="download-button">Download PDF</button>
                            </a>
                        </div>
                    )}

                    <button onClick={() => navigate(-1)} className="back-button">Go Back</button>
                </div>
            </div>
        </div>
    );
};

export default Tester;
