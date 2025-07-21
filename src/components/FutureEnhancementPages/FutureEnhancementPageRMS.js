import React, { useRef, useState } from 'react';
import './FutureEnhancementPageRMS.css';
import { useNavigate } from 'react-router-dom';

const FutureEnhancementPageRMS = () => {
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
        <div className="future-enhancement-page-rms-container">
            <section
                ref={sectionRefs[0]}
                className="future-enhancement-page-rms-section future-enhancement-page-rms-section-1"
            >
                <img
                    src={`${process.env.PUBLIC_URL}/FI_Logo.svg`}
                    alt="Section 1 Illustration"
                    className="future-enhancement-page-rms-section-1-image"
                />
                <p style={{ marginTop: "120px", fontSize: "20px", textAlign: "center", color: "black" }}>We are continuously exploring new ways to enhance the app’s functionality and user experience.<br />
                    Several new systems and modules are planned for development.</p>
            </section>

            <section
                ref={sectionRefs[1]}
                className="future-enhancement-page-rms-section future-enhancement-page-rms-section-2"
            >
                <div className="future-enhancement-page-rms-section-2-block-main">
                    <div className='fi-card'>
                        <img
                            src={`${process.env.PUBLIC_URL}/RM.png`}
                            alt="Training Management System (TMS)"
                            className="future-enhancement-page-rms-section-2-block-image-2"
                        />
                    </div>
                    <h3 className="future-enhancement-page-rms-section-2-block-title-main">
                        Risk Management System
                    </h3>

                    <p className="future-enhancement-page-rms-section-2-line">_______</p>
                </div>

                <div className="future-enhancement-page-rms-section-2-blocks">
                    {/* Block 1 */}
                    <div className="future-enhancement-page-rms-section-2-block">
                        <h2 className="future-enhancement-page-section-rms-2-header-2">What’s next
                            <br /><span style={{ marginTop: "20px", fontSize: "20px", textAlign: "center", color: "white" }}>Next 6 Months (Starting 01 July 2025)</span>
                            <br /><span style={{ marginTop: "20px", fontSize: "20px", textAlign: "center", color: "white", top: "-10px", position: "relative" }}>_______</span>
                        </h2>
                        <div className='fi-card-2'>
                            <img
                                src={`${process.env.PUBLIC_URL}/bta.svg`}
                                alt="Training Management System (TMS)"
                                className="future-enhancement-page-rms-section-2-block-image"
                            />

                            <p >
                                <strong>IBRA</strong><br />
                                (Using the BTA Tool)
                            </p>
                        </div>
                        <h3 className="future-enhancement-page-rms-section-2-block-title">
                            Bowtie Risk Assessment (BTA)
                        </h3>
                    </div>

                    {/* vertical divider */}
                    <div className="future-enhancement-page-rms-section-2-divider" />

                    {/* Block 2 */}
                    <div className="future-enhancement-page-rms-section-2-block">
                        <h2 className="future-enhancement-page-section-rms-2-header-2">Coming Soon
                            <br /><span style={{ marginTop: "20px", fontSize: "20px", textAlign: "center", color: "white" }}>Next 12 Months (Starting 01 July 2025)</span>
                            <br /><span style={{ marginTop: "20px", fontSize: "20px", textAlign: "center", color: "white", top: "-10px", position: "relative" }}>_______</span>
                        </h2>
                        <div className='fi-card-2'>
                            <img
                                src={`${process.env.PUBLIC_URL}/fmeca.svg`}
                                alt="Compliance Management System (CMS)"
                                className="future-enhancement-page-rms-section-2-block-image-2"
                            />

                            <p >
                                <strong>FMECA</strong><br />
                                (Failure Mode, Effective and
                                Criticality Analysis)

                            </p>
                        </div>
                        <h3 className="future-enhancement-page-rms-section-2-block-title">
                            FMECA (Failure Mode, Effective and
                            Criticality Analysis)

                        </h3>
                    </div>
                </div>
                <button className="logout-button-fi-rms" onClick={() => navigate(-1)}>Back</button>
            </section>
        </div>
    );
};

export default FutureEnhancementPageRMS;
