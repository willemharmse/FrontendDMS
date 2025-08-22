import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BurgerMenu.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { isAdmin } from "../../utils/auth";

const BurgerMenu = ({ canIn, access, isOpen, setIsOpen, risk }) => {
    const navigate = useNavigate();
    const link = risk ? "/riskApprover" : "/adminApprover";
    const handleLogout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        navigate("/");
    };

    const handleDownload = async () => {
        try {
            // Using axios to download a file
            const response = await axios.get(`${process.env.REACT_APP_URL}/api/test/export-excel`, {
                responseType: 'blob' // Important for file downloads
            });

            // Extract filename from Content-Disposition header
            const contentDisposition = response.headers['content-disposition'];
            console.log('Content-Disposition:', contentDisposition);
            let fileName = 'database_export.xlsx'; // Default filename

            if (contentDisposition) {
                const match = contentDisposition.match(/filename\*?=([^;]+)/i);
                if (match) {
                    fileName = match[1].trim().replace(/['"]/g, ''); // Remove quotes if present
                }
            }

            // Create a download link and trigger it
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting Excel:', error);
            alert('Error exporting Excel file. Please try again.');
        } finally {
            console.log('Export complete');
        }
    };

    return (
        <div className="burger-menu-container">
            {isOpen && (
                <div className="menu-content" onMouseLeave={() => setIsOpen(false)}>
                    <ul>
                        {canIn(access, "RMS", ["systemAdmin"]) && !isAdmin(access) && (
                            <li onClick={() => navigate(link)}>Suggestions</li>
                        )}

                        {canIn(access, "DDS", ["systemAdmin"]) && !isAdmin(access) && (
                            <li onClick={() => navigate(link)}>Suggestions</li>
                        )}

                        {isAdmin(access) && (
                            <li onClick={() => navigate(link)}>Suggestions</li>
                        )}

                        <li onClick={() => navigate("/userProfile")}>My Profile</li>
                        <li onClick={handleLogout}>Logout</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BurgerMenu;