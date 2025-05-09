import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./RiskHomePage.css";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHardHat, faListCheck, faNetworkWired } from '@fortawesome/free-solid-svg-icons';

import TopBar from "../Notifications/TopBar";

const RiskHomePage = () => {
    const [role, setRole] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setRole(decodedToken.role);
        }
    }, [navigate]);

    return (
        <div className="risk-info-container">
            <div className="sidebar-um">
                <div className="sidebar-logo-um">
                    <img src={`${process.env.PUBLIC_URL}/CH_Logo.png`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                    <p className="logo-text-um">Risk Management</p>
                </div>
            </div>

            <div className="main-box-risk">
                <div className="top-section-um">
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar role={role} />
                </div>

                <div className="scrollable-box-risk-home">
                    <div className={`document-card-risk-home`} onClick={() => navigate("/FrontendDMS/constructionRMS/Bowtie")}>
                        <>
                            <div className="icon-risk">
                                <FontAwesomeIcon icon={faNetworkWired} className={"icon-risk"} />
                            </div>
                            <h3 className="document-title-risk-home">Bowtie</h3>
                        </>
                    </div>
                    <div className={`document-card-risk-home`} onClick={() => navigate("/FrontendDMS/risk/IBRA")}>
                        <>
                            <div className="icon-risk">
                                <FontAwesomeIcon icon={faListCheck} className={"icon-risk"} />
                            </div>
                            <h3 className="document-title-risk-home">IBRA</h3>
                        </>
                    </div>
                    <div className={`document-card-risk-home`} onClick={() => navigate("/FrontendDMS/constructionRMS/JRA")}>
                        <>
                            <div className="icon-risk">
                                <FontAwesomeIcon icon={faHardHat} className={"icon-risk"} />
                            </div>
                            <h3 className="document-title-risk-home">JRA</h3>
                        </>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default RiskHomePage;