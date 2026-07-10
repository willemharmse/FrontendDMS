import React, { useEffect, useRef, useState } from 'react';
import './TemplatePreviewPopup.css';

/**
 * TemplatePreviewPopup
 *
 * Shows a preview of the generated field-template PDF in an <iframe>.
 * The PDF bytes are fetched (POST, with the same formData used by
 * /generate-template) from the /preview-template backend route, which
 * returns the PDF with `Content-Disposition: inline` so it can be
 * rendered directly instead of being downloaded.
 *
 * Props:
 *  - onClose: () => void            called when the popup should close
 *  - formData: object                the same formData shape sent to /generate-template
 *  - previewEndpoint: string         full URL to the preview route (defaults below — adjust to match your API base)
 */
const TemplatePreviewPopup = ({
    onClose,
    formData,
    previewEndpoint = '/api/fieldTemplateCreation/preview-template',
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');
    const objectUrlRef = useRef('');

    useEffect(() => {
        let cancelled = false;

        const fetchPreview = async () => {
            setLoading(true);
            setError('');

            try {
                const storedToken = localStorage.getItem('token');

                const response = await fetch(previewEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
                    },
                    body: JSON.stringify({ formData }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to load preview (status ${response.status})`);
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                if (cancelled) {
                    URL.revokeObjectURL(url);
                    return;
                }

                objectUrlRef.current = url;
                setPdfUrl(url);
            } catch (err) {
                if (!cancelled) {
                    console.error('Error loading template preview:', err);
                    setError('Unable to load the template preview. Please try again.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchPreview();

        return () => {
            cancelled = true;
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewEndpoint]);

    return (
        <div className="template-preview-container">
            <div className="template-preview-overlay">
                <div className="template-preview-popup-right">
                    <div className="template-preview-popup-header-right">
                        <h2>Template Preview</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="template-preview-form-group-main-container">
                        <div className="template-preview-scroll-box">
                            <div className="template-preview-iframe-wrapper">
                                {loading && (
                                    <div className="template-preview-status">Loading preview…</div>
                                )}
                                {!loading && error && (
                                    <div className="template-preview-status template-preview-status-error">{error}</div>
                                )}
                                {!loading && !error && pdfUrl && (
                                    <iframe
                                        src={pdfUrl}
                                        className="template-preview-iframe"
                                        title="Template PDF Preview"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplatePreviewPopup;
