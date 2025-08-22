import { useEffect, useRef } from 'react';
import './SplashScreen.css';

export default function SplashScreen({
    logoSrc,
    titleText = 'ComplianceHub\u2122',
    onDone,
    pingUrl = '/ping',
    fastDuration = 1000,   // total time if ping ≤ 1s
    slowDuration = 6000,   // total time if ping > 1s or fails
    softThreshold = 1000,  // 1s threshold
}) {
    const doneCalled = useRef(false);

    useEffect(() => {
        const start = Date.now();
        const controller = new AbortController();

        function finishAfter(targetTotalMs) {
            if (doneCalled.current) return;
            doneCalled.current = true;

            const elapsed = Date.now() - start;
            const remaining = Math.max(0, targetTotalMs - elapsed);
            setTimeout(() => { if (typeof onDone === 'function') onDone(); }, remaining);
        }

        // Fire immediately
        fetch(pingUrl, { method: 'GET', cache: 'no-store', signal: controller.signal })
            .then(() => {
                const elapsed = Date.now() - start;
                finishAfter(elapsed <= softThreshold ? fastDuration : slowDuration);
            })
            .catch(() => finishAfter(slowDuration));

        // Absolute safety in case nothing returns
        const ultimateTimeout = setTimeout(() => finishAfter(slowDuration), slowDuration + 250);

        return () => { controller.abort(); clearTimeout(ultimateTimeout); };
    }, [pingUrl, fastDuration, slowDuration, softThreshold, onDone]);

    return (
        <div className="splash" role="dialog" aria-label="Loading application">
            <div className="splash-box">
                {logoSrc ? <img src={logoSrc} alt="Logo" className="splash-logo-main" /> : null}
                <div className="splash-title">{titleText}</div>
                <div className="splash-spinner" aria-hidden="true" />
            </div>
        </div>
    );
}
