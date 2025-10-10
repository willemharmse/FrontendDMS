import React, { useRef, useState } from 'react';
import './FutureEnhancementPageEPAC.css';
import { useNavigate } from 'react-router-dom';

const FutureEnhancementPageTMS = () => {
    // refs for each of the three sections
    const navigate = useNavigate();
    const sectionRefs = [
        useRef(null),
        useRef(null),
        useRef(null),
    ];

    // track which section is currently active
    const [currentSection, setCurrentSection] = useState(0);

    const scrollToSection = (index) => {
        if (sectionRefs[index].current) {
            sectionRefs[index].current.scrollIntoView({ behavior: 'smooth' });
            setCurrentSection(index);
        }
    };

    const handleScrollDown = () => {
        if (currentSection < sectionRefs.length - 1) {
            scrollToSection(currentSection + 1);
        }
    };

    const handleScrollUp = () => {
        if (currentSection > 0) {
            scrollToSection(currentSection - 1);
        }
    };

    return (
        <div className="future-enhancement-page-epac-container">
            <section
                ref={sectionRefs[0]}
                className="future-enhancement-page-epac-section future-enhancement-page-epac-section-1"
            >
                <img
                    src={`${process.env.PUBLIC_URL}/FI_Logo.svg`}
                    alt="Section 1 Illustration"
                    className="future-enhancement-page-epac-section-1-image"
                />
                <p style={{ marginTop: "120px", fontSize: "20px", textAlign: "center", color: "black" }}>We are continuously exploring new ways to enhance the app’s functionality and user experience.<br />
                    Several new systems and modules are planned for development.</p>
            </section>

            <section
                ref={sectionRefs[1]}
                className="future-enhancement-page-epac-section future-enhancement-page-epac-section-2"
            >
                <div className="future-enhancement-page-epac-section-2-block-main">
                    <div className='fi-card'>
                        <img
                            src={`${process.env.PUBLIC_URL}/TM.png`}
                            alt="Training Management System (TMS)"
                            className="future-enhancement-page-tms-section-2-block-image-2"
                        />
                    </div>
                    <h3 className="future-enhancement-page-epac-section-2-block-title-main">
                        Training Management System
                    </h3>

                    <p className="future-enhancement-page-epac-section-2-line">_______</p>
                </div>
                <div className="future-enhancement-page-rms-section-2-block">
                    <h2 className="future-enhancement-page-epac-section-2-header">What’s Next
                        <br /><span style={{ marginTop: "20px", fontSize: "28px", textAlign: "center", color: "white" }}>Next 6 Months (Starting 01 July 2025)</span>
                    </h2>
                    <div className='fi-card-2-epac'>
                        <img
                            src={`${process.env.PUBLIC_URL}/tmsTrainingAdmin.svg`}
                            alt="Training Management System (TMS)"
                            className="future-enhancement-page-rms-section-2-block-image"
                        />
                        <p style={{ fontSize: "19px", marginTop: "20px" }}>
                            <strong>Employee Training</strong>
                        </p>
                    </div>
                    <h3 className="future-enhancement-page-epac-section-2-block-title">
                        Employee Training Management (ETM)
                    </h3>
                </div>
                <button className="logout-button-fi-epac" onClick={() => navigate(-1)}>Back</button>
            </section>
        </div>
    );
};

export default FutureEnhancementPageTMS;
