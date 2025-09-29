import { useEffect, useRef } from 'react';
import './SplashScreen.css';

export default function SplashScreen({
    logoSrc,
    titleText = 'ComplianceHub\u2122',
    onDone,
    pingUrl = '/ping',
    fastDuration = 1000,   // absolute fast end from mount
    slowDuration = 6000,   // absolute slow end from mount
    softThreshold = 1000,  // race cutoff
}) {
    const finishedRef = useRef(false);
    const softFiredRef = useRef(false);
    const pingSettledRef = useRef(false);

    useEffect(() => {
        const controller = new AbortController();

        // Safety: ensure durations make sense
        if (softThreshold >= slowDuration) {
            // eslint-disable-next-line no-console
            console.warn('[Splash] softThreshold should be < slowDuration');
        }
        if (fastDuration >= slowDuration) {
            // eslint-disable-next-line no-console
            console.warn('[Splash] fastDuration should be < slowDuration');
        }

        const finish = () => {
            if (finishedRef.current) return;
            finishedRef.current = true;
            if (typeof onDone === 'function') onDone();
            controller.abort();
        };

        // Arm absolute timers from mount
        const fastTimer = setTimeout(() => {
            if (!softFiredRef.current && pingSettledRef.current) {
                // Ping won before soft gate -> fast path
                finish();
            }
            // If soft fired first, fast timer is ignored (we cancel it below).
        }, fastDuration);

        const slowTimer = setTimeout(() => {
            // Slow path always allowed to complete
            finish();
        }, slowDuration);

        // Soft gate: if this fires first, we’re slow; cancel fast timer
        const softGate = setTimeout(() => {
            softFiredRef.current = true;
            clearTimeout(fastTimer); // force slow path
        }, softThreshold);

        // Kick off ping
        fetch(pingUrl, { method: 'GET', cache: 'no-store', signal: controller.signal })
            .then(() => {
                pingSettledRef.current = true;
                if (!softFiredRef.current) {
                    // Ping beat the soft gate → cancel slow, let fast fire at fastDuration
                    clearTimeout(slowTimer);
                } else {
                    // Soft gate already fired → cancel fast (if not already) and keep slow
                    clearTimeout(fastTimer);
                }
            })
            .catch(() => {
                // Failure → slow path: cancel fast, keep slow
                clearTimeout(fastTimer);
            });

        // Hard safety net in case timers are cleared elsewhere
        const hardNet = setTimeout(() => finish(), slowDuration + 500);

        return () => {
            controller.abort();
            clearTimeout(fastTimer);
            clearTimeout(slowTimer);
            clearTimeout(softGate);
            clearTimeout(hardNet);
        };
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
