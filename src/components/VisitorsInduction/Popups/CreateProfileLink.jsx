import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { toast } from 'react-toastify';

function safeFrontendBase() {
    try {
        const fromCRA = process.env.REACT_APP_FRONTEND_LINK;
        return fromCRA;
    } catch {
        return window.location.origin;
    }
}

const CreateProfileLink = ({
    onClose,
    visitorName = '',
    visitorEmail = '',
    profileLink = '',
    profileId = '',
    // 👇 Set this to your router mount path, e.g. '/visitorsInduction'
    apiBase = `${process.env.REACT_APP_URL}/api/visitors`
}) => {
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [link, setLink] = useState(profileLink || '');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    const FRONTEND_BASE = useMemo(() => safeFrontendBase(), []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/visitors/shareLink/${profileId}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                toast.error(data?.message || 'OTP verification failed');
            }

            toast.success(data?.message || 'OTP verification failed');
        } catch (err) {
            setError(err.message || 'Something went wrong');
            setTimeout(() => setError(''), 3000);
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    };

    useEffect(() => {
        let ignore = false;

        (async () => {
            console.log('[CreateProfileLink] mounted');
            console.log('[CreateProfileLink] props:', { profileId, apiBase, FRONTEND_BASE });

            setInitializing(true);
            setError('');

            if (!profileId) {
                console.error('[CreateProfileLink] Missing profileId — cannot build route URL');
                setError('Missing profileId');
                setInitializing(false);
                return;
            }

            const url = `${apiBase}/getVisitorLink/${encodeURIComponent(
                profileId
            )}?frontendURL=${encodeURIComponent(FRONTEND_BASE)}`;

            // 👉 visible in UI too (optional)
            console.log('[CreateProfileLink] fetching:', url);

            try {
                const res = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    // add credentials if your API needs cookies/sessions:
                    // credentials: 'include',
                    headers: { 'Accept': 'application/json, text/plain;q=0.9,*/*;q=0.8' },
                });

                console.log('[CreateProfileLink] response status:', res.status);

                if (!res.ok) throw new Error(`HTTP_${res.status}`);

                const ct = res.headers.get('content-type') || '';
                let nextLink = '';

                if (ct.includes('application/json')) {
                    const data = await res.json();
                    nextLink = data.link || data.url || '';
                    console.log('[CreateProfileLink] json payload:', data);
                } else {
                    nextLink = (await res.text())?.trim();
                    console.log('[CreateProfileLink] text payload:', nextLink);
                }

                if (!ignore) setLink(nextLink || '');
            } catch (e) {
                console.error('[CreateProfileLink] fetch failed:', e);
                if (!ignore) {
                    setError('Could not get profile link');
                    setLink('');
                }
            } finally {
                if (!ignore) setInitializing(false);
            }
        })();

        return () => {
            ignore = true;
            console.log('[CreateProfileLink] unmounted');
        };
    }, [apiBase, FRONTEND_BASE, profileId]);

    const copyToClipboard = async () => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(link);
            } else {
                inputRef.current?.select();
                document.execCommand('copy');
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
        } catch { }
    };

    return (
        <div className="create-visitor-profile-page-container">
            <div className="create-visitor-profile-page-overlay">
                <div className="create-visitor-profile-page-popup-right-3">
                    <div className="create-visitor-profile-page-popup-header-right">
                        <h2>Share Visitor Profile</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="cpl-content">
                        <div className="cpl-panel">
                            <div className="cpl-info-title">Visitor Information:</div>

                            <div className="cpl-info-line">
                                <span className="cpl-info-label">Visitor Name:</span>&nbsp;
                                <span className="cpl-info-value">{visitorName || '-'}</span>
                            </div>

                            <div className="cpl-info-line">
                                <span className="cpl-info-label">Email:</span>&nbsp;
                                {visitorEmail ? (
                                    <a className="cpl-info-link" href={`mailto:${visitorEmail}`}>{visitorEmail}</a>
                                ) : <span className="cpl-info-value">-</span>}
                            </div>

                            <div className="cpl-link-title">Visitor Profile Link:</div>

                            <div className="cpl-link-row">
                                <input
                                    ref={inputRef}
                                    className="cpl-link-input"
                                    placeholder={initializing ? 'Fetching link…' : 'Visitor Profile Link'}
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    readOnly={initializing}
                                />
                                <button
                                    type="button"
                                    className="cpl-copy-btn"
                                    onClick={copyToClipboard}
                                    title="Copy to clipboard"
                                    disabled={!link || initializing}
                                >
                                    <FontAwesomeIcon icon={faCopy} />
                                </button>
                                {copied && <span className="cpl-copied-hint">Copied!</span>}
                                {error && <span className="cpl-error-hint">{error}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="create-visitor-profile-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="create-visitor-profile-page-upload-button"
                                onClick={handleSubmit}
                                disabled={loading || !link || initializing}
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Share'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateProfileLink;
