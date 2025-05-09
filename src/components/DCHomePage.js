import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./DCHomePage.css";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScaleBalanced, faCertificate, faListOl } from '@fortawesome/free-solid-svg-icons';

import TopBar from "./Notifications/TopBar";

const DCHomePage = () => {
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
        <div className="dc-info-container">
            <div className="sidebar-um">
                <div className="sidebar-logo-um">
                    <img src={`${process.env.PUBLIC_URL}/CH_Logo.png`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                    <p className="logo-text-um">Document Development</p>
                </div>
            </div>

            <div className="main-box-dc">
                <div className="top-section-um">
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar role={role} />
                </div>

                <div className="scrollable-box-dc-home">
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/constructionDDS/Policy")}>
                        <>
                            <div className="icon-dc">
                                <FontAwesomeIcon icon={faScaleBalanced} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Policy</h3>
                        </>
                    </div>
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/documentCreate/Procedure")}>
                        <>
                            <div className="icon-dc">
                                <FontAwesomeIcon icon={faListOl} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Procedure</h3>
                        </>
                    </div>
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/constructionDDS/Standard")}>
                        <>
                            <div className="icon-dc">
                                <FontAwesomeIcon icon={faCertificate} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Standard</h3>
                        </>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default DCHomePage;