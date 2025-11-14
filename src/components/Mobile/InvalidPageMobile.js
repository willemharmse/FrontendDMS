// InvalidPageMobile.js
import './InvalidPageMobile.css';

const InvalidPageMobile = () => {
    return (
        <div className="invalid-page-class-container" style={{ fontFamily: "Arial" }}>
            <div className="invalid-page-class-card">
                <img
                    src={`${process.env.PUBLIC_URL}/CH_Logo.svg`}
                    className="invalid-page-class-logo"
                    alt="ComplianceHub logo"
                />

                <div className="invalid-page-class-title">
                    ComplianceHub{"\u2122"}
                </div>

                {/* Text between title and bottom logo */}
                <p className="invalid-page-class-message" style={{ marginTop: "auto", marginBottom: "auto" }}>
                    This visitor induction link cannot be accessed from a mobile device. Please use a desktop browser to complete the induction.
                </p>
            </div>

            {/* Bottom area with logo and version number */}
            <div className="invalid-page-class-bottom">
                <div className="invalid-page-class-bottom-left">
                    <img
                        className="invalid-page-class-bottom-logo"
                        src={`${process.env.PUBLIC_URL}/logo.webp`}
                        alt="Bottom Logo"
                    />
                    <p className="invalid-page-class-bottom-caption">
                        A TAU5 PRODUCT
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InvalidPageMobile;