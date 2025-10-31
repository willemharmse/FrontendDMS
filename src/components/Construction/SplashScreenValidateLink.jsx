import { useEffect, useRef } from 'react';
import './SplashScreen.css';

export default function SplashScreenValidateLink({
    titleText = 'ComplianceHub\u2122',
}) {
    return (
        <div className="splash" role="dialog" aria-label="Loading application">
            <div className="splash-box">
                <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="splash-logo-main" />
                <div className="splash-title">{titleText}</div>
                <div className="splash-spinner" aria-hidden="true" />
            </div>
        </div>
    );
}
