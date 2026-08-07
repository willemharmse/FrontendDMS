import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faLocationDot, faPaperclip, faSpinner, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";

// ---------------------------------------------------------------------------
// ActionFieldControl
//
// Given one Action Field definition ({ title, type, required, options }),
// renders the actual capture control for that type - a real textarea, a
// real signature pad, a real "get my GPS position" button, etc.
//
// This is the piece that makes the builder's "Preview" column an honest
// preview instead of a picture of a field: it's the exact same component
// that should be dropped into the live Work Order execution screen later,
// so "design the field" and "capture the field" always stay in sync.
//
// value / onChange follow the shape:
//   text / number / dropdown / yesno / passfail / buttons / datetime -> string
//   photo / file                                                     -> array of { name, url }
//   signature                                                        -> data URL string ("" if empty)
//   gps                                                               -> { lat, lng, accuracy, capturedAt } | null
// ---------------------------------------------------------------------------
const ActionFieldControl = ({ field, value, onChange, readOnly = false }) => {
    switch (field.type) {
        case "text":
            return (
                <textarea
                    className="waf-control waf-textarea"
                    value={value || ""}
                    placeholder={`Insert ${field.title || "text"}`}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    readOnly={readOnly}
                />
            );

        case "number":
            return (
                <input
                    type="number"
                    className="waf-control waf-input"
                    value={value ?? ""}
                    placeholder="0"
                    onChange={(e) => onChange && onChange(e.target.value)}
                    readOnly={readOnly}
                />
            );

        case "dropdown":
            return (
                <select
                    className="waf-control waf-select"
                    value={value || ""}
                    disabled={readOnly}
                    onChange={(e) => onChange && onChange(e.target.value)}
                >
                    <option value="" disabled>Select an option</option>
                    {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );

        case "yesno":
        case "passfail":
        case "buttons": {
            const options =
                field.type === "yesno" ? ["Yes", "No"] :
                    field.type === "passfail" ? ["Pass", "Fail"] :
                        (field.options && field.options.length ? field.options : ["Compliant", "Non-Compliant", "Not Applicable"]);

            return (
                <div className="waf-button-group">
                    {options.map((opt) => {
                        const isActive = value === opt;
                        const toneClass =
                            opt === "Yes" || opt === "Pass" || opt === "Compliant" ? "waf-btn-positive" :
                                opt === "No" || opt === "Fail" || opt === "Non-Compliant" ? "waf-btn-negative" :
                                    "waf-btn-neutral";
                        return (
                            <button
                                type="button"
                                key={opt}
                                disabled={readOnly}
                                className={`waf-choice-btn ${toneClass} ${isActive ? "waf-choice-btn-active" : ""}`}
                                onClick={() => onChange && onChange(isActive ? "" : opt)}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            );
        }

        case "datetime":
            return (
                <input
                    type="datetime-local"
                    className="waf-control waf-input"
                    value={value || ""}
                    disabled={readOnly}
                    onChange={(e) => onChange && onChange(e.target.value)}
                />
            );

        case "photo":
            return (
                <PhotoCaptureControl value={value} onChange={onChange} readOnly={readOnly} />
            );

        case "signature":
            return (
                <SignaturePadControl value={value} onChange={onChange} readOnly={readOnly} />
            );

        case "barcode":
            return (
                <BarcodeScanControl value={value} onChange={onChange} readOnly={readOnly} />
            );

        case "gps":
            return (
                <GpsStampControl value={value} onChange={onChange} readOnly={readOnly} />
            );

        case "file":
            return (
                <FileAttachmentControl value={value} onChange={onChange} readOnly={readOnly} />
            );

        default:
            return null;
    }
};

// --- Photo Capture: opens the camera on mobile (capture="environment"), falls back to file picker on desktop ---
const PhotoCaptureControl = ({ value, onChange, readOnly }) => {
    const files = value || [];
    const inputRef = useRef(null);

    const handleFiles = (fileList) => {
        const next = Array.from(fileList || []).map((f) => ({
            name: f.name,
            url: URL.createObjectURL(f),
        }));
        onChange && onChange([...files, ...next]);
    };

    const removeAt = (idx) => {
        onChange && onChange(files.filter((_, i) => i !== idx));
    };

    return (
        <div className="waf-media-control">
            {!readOnly && (
                <button type="button" className="waf-capture-btn" onClick={() => inputRef.current && inputRef.current.click()}>
                    Capture Photo
                </button>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleFiles(e.target.files)}
            />
            {files.length > 0 && (
                <div className="waf-thumb-row">
                    {files.map((f, idx) => (
                        <div className="waf-thumb" key={`${f.name}-${idx}`}>
                            <img src={f.url} alt={f.name} />
                            {!readOnly && (
                                <button type="button" className="waf-thumb-remove" onClick={() => removeAt(idx)}>
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Signature: simple canvas-based pad, captures mouse + touch strokes ---
const SignaturePadControl = ({ value, onChange, readOnly }) => {
    const canvasRef = useRef(null);
    const drawing = useRef(false);

    useEffect(() => {
        // Restore a previously captured signature (e.g. loaded from a draft).
        const canvas = canvasRef.current;
        if (!canvas || !value) return;
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = value;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const point = e.touches ? e.touches[0] : e;
        return { x: point.clientX - rect.left, y: point.clientY - rect.top };
    };

    const startDraw = (e) => {
        if (readOnly) return;
        drawing.current = true;
        const ctx = canvasRef.current.getContext("2d");
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (readOnly || !drawing.current) return;
        e.preventDefault();
        const ctx = canvasRef.current.getContext("2d");
        const { x, y } = getPos(e);
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endDraw = () => {
        if (readOnly || !drawing.current) return;
        drawing.current = false;
        onChange && onChange(canvasRef.current.toDataURL("image/png"));
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onChange && onChange("");
    };

    return (
        <div className="waf-signature-control">
            <canvas
                ref={canvasRef}
                width={320}
                height={120}
                className="waf-signature-canvas"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
            />
            {!readOnly && (
                <button type="button" className="waf-clear-btn" onClick={clear}>
                    <FontAwesomeIcon icon={faTrash} /> Clear Signature
                </button>
            )}
        </div>
    );
};

// --- Barcode / QR Scan: camera capture of the code, with a manual fallback ---
const BarcodeScanControl = ({ value, onChange, readOnly }) => {
    const inputRef = useRef(null);
    const codeValue = typeof value === "string" ? value : (value && value.code) || "";
    const imageUrl = value && value.imageUrl;

    const handleScanImage = (fileList) => {
        const file = fileList && fileList[0];
        if (!file) return;
        onChange && onChange({ code: codeValue, imageUrl: URL.createObjectURL(file) });
    };

    return (
        <div className="waf-media-control">
            {!readOnly && (
                <button type="button" className="waf-capture-btn" onClick={() => inputRef.current && inputRef.current.click()}>
                    Scan Barcode / QR
                </button>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={(e) => handleScanImage(e.target.files)}
            />
            {imageUrl && (
                <div className="waf-thumb-row">
                    <div className="waf-thumb"><img src={imageUrl} alt="Scanned code" /></div>
                </div>
            )}
            <input
                type="text"
                className="waf-control waf-input"
                placeholder="Or enter code manually"
                value={codeValue}
                readOnly={readOnly}
                onChange={(e) => onChange && onChange({ code: e.target.value, imageUrl })}
            />
        </div>
    );
};

// --- GPS / Location Stamp: reads the device's current position ---
const GpsStampControl = ({ value, onChange, readOnly }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const captureLocation = () => {
        if (!navigator.geolocation) {
            setError("Location is not supported on this device.");
            return;
        }
        setLoading(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLoading(false);
                onChange && onChange({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    capturedAt: new Date().toISOString(),
                });
            },
            (err) => {
                setLoading(false);
                setError(err.message || "Unable to capture location.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="waf-gps-control">
            {!readOnly && (
                <button type="button" className="waf-capture-btn" onClick={captureLocation} disabled={loading}>
                    {loading ? "Capturing..." : "Capture Location"}
                </button>
            )}
            {value && (
                <div className="waf-gps-readout">
                    Lat {value.lat.toFixed(5)}, Lng {value.lng.toFixed(5)} (±{Math.round(value.accuracy)}m)
                    <br />
                    <span className="waf-gps-timestamp">{new Date(value.capturedAt).toLocaleString()}</span>
                </div>
            )}
            {error && <div className="waf-error-text">{error}</div>}
        </div>
    );
};

// --- File Attachment: any file type, e.g. certificates/reports ---
const FileAttachmentControl = ({ value, onChange, readOnly }) => {
    const files = value || [];
    const inputRef = useRef(null);

    const handleFiles = (fileList) => {
        const next = Array.from(fileList || []).map((f) => ({
            name: f.name,
            url: URL.createObjectURL(f),
        }));
        onChange && onChange([...files, ...next]);
    };

    const removeAt = (idx) => {
        onChange && onChange(files.filter((_, i) => i !== idx));
    };

    return (
        <div className="waf-media-control">
            {!readOnly && (
                <button type="button" className="waf-capture-btn" onClick={() => inputRef.current && inputRef.current.click()}>
                    Attach File
                </button>
            )}
            <input
                ref={inputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleFiles(e.target.files)}
            />
            {files.length > 0 && (
                <ul className="waf-file-list">
                    {files.map((f, idx) => (
                        <li key={`${f.name}-${idx}`}>
                            <a href={f.url} target="_blank" rel="noreferrer">{f.name}</a>
                            {!readOnly && (
                                <button type="button" className="waf-thumb-remove" onClick={() => removeAt(idx)}>
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ActionFieldControl;
