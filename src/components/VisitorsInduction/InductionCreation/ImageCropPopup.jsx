import React, { useRef, useState, useCallback } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faArrowsLeftRight, faArrowsUpDown } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { Cropper } from 'react-cropper';
import 'cropperjs/dist/cropper.min.css';

const DEFAULT_ASPECT = 16 / 9;

const ImageCropPopup = ({ previewUrl, originalFile, onClose, onUpload }) => {
    const cropperRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [aspect, setAspect] = useState(DEFAULT_ASPECT);
    const [dragMode, setDragMode] = useState('crop'); // you still have this in state

    // --- helper: centerCanvas & fit helpers (unchanged) ---
    const centerCanvas = (cropper, width, height) => {
        const container = cropper.getContainerData();
        const left = Math.round((container.width - width) / 2);
        const top = Math.round((container.height - height) / 2);
        cropper.setCanvasData({ left, top, width, height });
    };

    const fitToWidth = useCallback(() => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) return;
        const container = cropper.getContainerData();
        const image = cropper.getImageData();
        const aspectRatio = image.naturalWidth / image.naturalHeight;

        const targetW = container.width;
        const targetH = targetW / aspectRatio;
        centerCanvas(cropper, targetW, targetH);
    }, []);

    const fitToHeight = useCallback(() => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) return;
        const container = cropper.getContainerData();
        const image = cropper.getImageData();
        const aspectRatio = image.naturalWidth / image.naturalHeight;

        const targetH = container.height;
        const targetW = targetH * aspectRatio;
        centerCanvas(cropper, targetW, targetH);
    }, []);

    // initialize the canvas position and aspect ratio when ready
    const handleReady = useCallback(() => {
        fitToWidth();
        cropperRef.current?.cropper.setAspectRatio(aspect ?? DEFAULT_ASPECT);
    }, [fitToWidth, aspect]);

    const setAspectRatio = (val) => {
        setAspect(val);
        const cropper = cropperRef.current?.cropper;
        if (cropper) cropper.setAspectRatio(val);
    };

    /**
     * Fallback export:
     * Take EXACTLY what's visible in the cropper viewport div (the 925x520 box),
     * clip any part of the image that's off-screen, and return a Blob.
     */
    const exportVisibleAreaAsBlob = async (cropper) => {
        const containerData = cropper.getContainerData(); // { width, height }
        const canvasData = cropper.getCanvasData();       // { left, top, width, height }
        const imageData = cropper.getImageData();         // { naturalWidth, naturalHeight }
        const imgEl = cropper.image;                      // underlying <img>

        if (!imgEl) return null;

        // The image is drawn at (canvasData.left, canvasData.top) in container space,
        // and scaled to canvasData.width x canvasData.height.
        // We want the overlap between the container (0..container.width, 0..container.height)
        // and that drawn image rectangle.

        const visibleLeft = Math.max(0, canvasData.left);
        const visibleTop = Math.max(0, canvasData.top);
        const visibleRight = Math.min(
            containerData.width,
            canvasData.left + canvasData.width
        );
        const visibleBottom = Math.min(
            containerData.height,
            canvasData.top + canvasData.height
        );

        const visibleWidth = visibleRight - visibleLeft;
        const visibleHeight = visibleBottom - visibleTop;

        if (visibleWidth <= 0 || visibleHeight <= 0) {
            // nothing visible? shouldn't happen in normal flow
            return null;
        }

        // figure out how container-space pixels map back to natural image pixels
        const scaleX = imageData.naturalWidth / canvasData.width;
        const scaleY = imageData.naturalHeight / canvasData.height;

        // source rectangle on the ORIGINAL image in natural pixels
        const sx = (visibleLeft - canvasData.left) * scaleX;
        const sy = (visibleTop - canvasData.top) * scaleY;
        const sWidth = visibleWidth * scaleX;
        const sHeight = visibleHeight * scaleY;

        // draw that portion to an offscreen canvas
        const outCanvas = document.createElement('canvas');
        outCanvas.width = Math.round(sWidth);
        outCanvas.height = Math.round(sHeight);
        const ctx = outCanvas.getContext('2d');

        ctx.drawImage(
            imgEl,
            sx,
            sy,
            sWidth,
            sHeight,
            0,
            0,
            outCanvas.width,
            outCanvas.height
        );

        return new Promise((resolve) => {
            outCanvas.toBlob(
                (blob) => {
                    resolve(blob || null);
                },
                'image/jpeg',
                0.95
            );
        });
    };

    /**
     * Check if the user actually made a crop box.
     * If they didn't crop, Cropper's getData() will usually have width/height = 0 or tiny.
     */
    const userHasCropBox = (cropper) => {
        const data = cropper.getData(); // crop box in natural image pixels
        // if width/height are meaningful, assume they actually cropped
        return data && data.width > 1 && data.height > 1;
    };

    // Export / Upload handler
    const handleUploadClick = async () => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) {
            toast.error("Cropper not ready.");
            return;
        }

        setLoading(true);

        try {
            let blob = null;

            if (userHasCropBox(cropper)) {
                // normal path: user drew/adjusted a crop box
                const canvas = cropper.getCroppedCanvas({
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                    fillColor: '#fff',
                });

                if (canvas) {
                    blob = await new Promise((resolve) => {
                        canvas.toBlob(
                            (b) => resolve(b || null),
                            'image/jpeg',
                            0.95
                        );
                    });
                }
            } else {
                // fallback path: no crop box -> take what is visible in the viewport
                blob = await exportVisibleAreaAsBlob(cropper);
            }

            if (!blob) {
                toast.error("Could not create image.");
                setLoading(false);
                return;
            }

            const name = originalFile?.name || 'cropped.jpg';
            const file = new File([blob], name, { type: blob.type || 'image/jpeg' });

            onUpload(file);
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error("Error while preparing image.");
            setLoading(false);
        }
    };

    return (
        <div className="batch-popup-overlay-assets">
            <div className="batch-popup-content-assets" style={{ maxWidth: '1200px', height: '690px' }}>
                <div className="batch-file-header">
                    <h2 className="batch-file-title">Upload Media</h2>
                    <button className="batch-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div style={{ padding: '16px 20px 0 20px' }}>
                    {/* Crop area */}
                    <div
                        style={{
                            height: '520px',
                            width: '925px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            background: '#f8f8f8',
                            border: '1px solid #eee',
                            overflow: 'hidden',
                            marginLeft: "auto",
                            marginRight: "auto"
                        }}
                    >
                        <Cropper
                            ref={cropperRef}
                            src={previewUrl}
                            style={{ height: '520px', width: '925px' }}
                            viewMode={1}
                            dragMode={dragMode}
                            initialAspectRatio={aspect || DEFAULT_ASPECT}
                            aspectRatio={aspect || DEFAULT_ASPECT}
                            guides={true}
                            background={false}
                            autoCrop={false}          // keep this: user chooses to crop or not
                            autoCropArea={1}
                            responsive={true}
                            checkOrientation={true}
                            movable={true}
                            zoomable={true}
                            scalable={true}
                            rotatable={true}
                            cropBoxMovable={true}
                            cropBoxResizable={true}
                            toggleDragModeOnDblclick={false}
                            zoomOnWheel={true}
                            ready={handleReady}
                        />
                    </div>

                    {/* Controls */}
                    <div
                        className="batch-file-buttons"
                        style={{
                            justifyContent: 'center',
                            marginTop: 12,
                            marginBottom: 12,
                            gap: 12,
                            flexWrap: 'wrap'
                        }}
                    >
                        <button className="batch-file-button" title="Fit to width" onClick={fitToWidth}>
                            <FontAwesomeIcon icon={faArrowsLeftRight} /> Fit width
                        </button>
                        <button className="batch-file-button" title="Fit to height" onClick={fitToHeight}>
                            <FontAwesomeIcon icon={faArrowsUpDown} /> Fit height
                        </button>
                    </div>
                </div>

                <div className="batch-file-buttons">
                    <button className="batch-file-button-sub" disabled={loading} onClick={handleUploadClick}>
                        {loading ? <FontAwesomeIcon icon={faSpinner} className="spin-animation" /> : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropPopup;
