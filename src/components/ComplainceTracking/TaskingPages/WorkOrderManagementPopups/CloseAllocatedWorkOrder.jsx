import { faBroom } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useRef, useEffect } from "react";

const CloseAllocatedWorkOrder = ({ open, taskName, onClose, onConfirm }) => {
    const [closeOutComments, setCloseOutComments] = useState("");
    const [hasSignature, setHasSignature] = useState(false);
    const [signatureError, setSignatureError] = useState("");

    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef(null);

    // Reset the pad every time the modal opens, so a signature left over
    // from a previous close-out (or a previous open/cancel of this one)
    // never carries forward.
    useEffect(() => {
        if (!open) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#111";
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        setHasSignature(false);
        setSignatureError("");
    }, [open]);

    if (!open) return null;

    const getPoint = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Canvas is drawn at a fixed internal resolution but stretched to
        // fill the modal width via CSS, so pointer coords need to be
        // rescaled back into canvas space or strokes drift on smaller
        // screens.
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height),
        };
    };

    const startDraw = (e) => {
        e.preventDefault();
        isDrawingRef.current = true;
        lastPointRef.current = getPoint(e);
    };

    const draw = (e) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const point = getPoint(e);
        const last = lastPointRef.current;

        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();

        lastPointRef.current = point;
        // Once a stroke is drawn, the pad is satisfied - clear any leftover
        // "please sign" error from an earlier confirm attempt so it doesn't
        // keep showing after the user has, in fact, signed.
        if (!hasSignature) setHasSignature(true);
        if (signatureError) setSignatureError("");
    };

    const stopDraw = () => {
        isDrawingRef.current = false;
        lastPointRef.current = null;
    };

    const handleClearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleConfirm = () => {
        if (!hasSignature) {
            setSignatureError("Please sign to confirm the close out.");
            return;
        }

        const canvas = canvasRef.current;
        const signatureDataUrl = canvas.toDataURL("image/png");

        // Shape matches the WorkOrderTask schema's accountableSignature
        // sub-document exactly, so the parent can forward this straight
        // through to PUT /:id/close without reshaping it. username/date are
        // sent for completeness but the server always re-stamps both from
        // the authenticated user and the request time - it never trusts
        // these two off the client.
        onConfirm({
            closeOutComments,
            accountableSignature: {
                date: new Date().toISOString(),
                signature: signatureDataUrl,
            },
        });

        setCloseOutComments("");
        handleClearSignature();
    };

    const handleClose = () => {
        setCloseOutComments("");
        handleClearSignature();
        setSignatureError("");
        onClose();
    };

    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Close Out Work Order</h2>
                    <button className="delete-file-close" onClick={handleClose} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">Are you sure you want to close out this work order?</div>
                    <div>{taskName || ""}</div>
                </div>

                <div className="manDefs-popup-group" style={{ marginTop: "12px" }}>
                    <label className="delete-file-text" style={{ fontWeight: "normal", marginBottom: "10px" }}>Close Out Comments</label>
                    <textarea
                        rows={4}
                        style={{ resize: "none", marginTop: "10px", fontFamily: "Arial" }}
                        spellCheck="true"
                        className="manDefs-input-text-area"
                        placeholder="Add any comments regarding the close out of this task."
                        value={closeOutComments}
                        onChange={(e) => setCloseOutComments(e.target.value)}
                    />
                </div>

                <div className="manDefs-popup-group" style={{ marginTop: "12px" }}>
                    <label className="delete-file-text" style={{ fontWeight: "normal", marginBottom: "10px" }}>
                        Signature <span style={{ color: "#c0392b" }}>*</span>
                    </label>
                    <div
                        style={{
                            position: "relative",
                            border: signatureError ? "1px solid #c0392b" : "1px solid #ccc",
                            borderRadius: "4px",
                            marginTop: "10px",
                            touchAction: "none",
                            width: "calc(100% - 30px)",
                            marginLeft: "auto",
                            marginRight: "auto"
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleClearSignature}
                            title="Clear signature"
                            aria-label="Clear signature"
                            style={{
                                position: "absolute",
                                top: "6px",
                                right: "6px",
                                width: "26px",
                                height: "26px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                                background: "#fff",
                                color: "#666",
                                cursor: "pointer",
                                padding: 0,
                                zIndex: 1,
                            }}
                        >
                            <FontAwesomeIcon icon={faBroom} />
                        </button>
                        <canvas
                            ref={canvasRef}
                            width={460}
                            height={140}
                            style={{ width: "100%", height: "140px", display: "block", cursor: "crosshair" }}
                            onMouseDown={startDraw}
                            onMouseMove={draw}
                            onMouseUp={stopDraw}
                            onMouseLeave={stopDraw}
                            onTouchStart={startDraw}
                            onTouchMove={draw}
                            onTouchEnd={stopDraw}
                        />
                    </div>
                    {signatureError && (
                        <div style={{
                            marginTop: "6px", width: "calc(100% - 30px)",
                            marginLeft: "auto", marginRight: "auto"
                        }}>
                            <span style={{ fontSize: "12px", color: "#c0392b" }}>
                                {signatureError}
                            </span>
                        </div>
                    )}
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-cancel" style={{ marginLeft: "auto", marginRight: "10px" }} onClick={handleConfirm}>
                        Close Out
                    </button>
                    <button className="delete-file-button-delete" style={{ marginLeft: "10px", marginRight: "auto" }} onClick={handleClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CloseAllocatedWorkOrder;