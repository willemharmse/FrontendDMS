import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faInfoCircle,
    faMagicWandSparkles,
    faRotateLeft,
    faSpinner,
    faTrash,
    faCirclePlus,
    faChevronDown,
    faChevronUp
} from "@fortawesome/free-solid-svg-icons";

const PurposeBackgroundComponent = ({
    readOnly,
    scopes = [{ type: "text", text: "" }],
    errors = [],
    loadingIndex = null,
    rewriteHistory,
    onChange,
    onBulletChange,
    onFocus,
    onHelp,
    onAiRewrite,
    onUndo,
    onAddScope,
    onRemoveScope,
    onRemoveScopeSection,
    onAddBullet,
    onRemoveBullet,
    collapsible = false
}) => {
    const [collapsed, setCollapsed] = useState(true);
    const isCollapsed = collapsible ? collapsed : false;
    const lastType = scopes?.length ? scopes[scopes.length - 1]?.type : "text";
    const nextType = lastType === "text" ? "bullet" : "text";
    const sectionCount = scopes.filter((item) => item?.type === "text").length;
    const bulletRefs = useRef({});

    const toggleCollapse = () => {
        setCollapsed((prev) => !prev);
    };

    const handleBulletKeyDown = (e, scopeIndex, bulletIndex) => {
        if (e.key === "Enter") {
            e.preventDefault();

            onAddBullet(scopeIndex, bulletIndex);

            setTimeout(() => {
                const nextKey = `${scopeIndex}-${bulletIndex + 1}`;
                const nextTextarea = bulletRefs.current[nextKey];
                if (nextTextarea) {
                    nextTextarea.focus();
                }
            }, 0);
        }
    };

    return (
        <div className="input-row-risk-create">
            <div className="input-box-aim-risk-create">
                <button
                    className="top-left-button-refs"
                    title="Information"
                    type="button"
                    onClick={onHelp}
                >
                    <FontAwesomeIcon
                        icon={faInfoCircle}
                        style={{ cursor: "pointer" }}
                        className="icon-um-search"
                    />
                </button>

                <h3 className="font-fam-labels">
                    Purpose and Background <span className="required-field">*</span>
                </h3>

                {collapsible && (
                    <button
                        className="top-right-button-ibra"
                        title={collapsed ? "Expand Section" : "Collapse Section"}
                        onClick={toggleCollapse}
                        style={{ color: "gray" }}
                        type="button"
                    >
                        <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
                    </button>
                )}

                {!isCollapsed && (
                    <>
                        {scopes.map((scope, index) => {
                            const isLast = index === scopes.length - 1;
                            const hasError = !!errors[index];
                            const isTextType = (scope?.type || "text") === "text";
                            const bullets = Array.isArray(scope?.bullets) ? scope.bullets : [];

                            return (
                                <React.Fragment key={index}>
                                    <div className={`aim-textarea-stack-item ${hasError ? "error-create" : ""}`}>
                                        {isTextType ? (
                                            (() => {
                                                const showRemoveSection = !readOnly && scopes[index + 1]?.type === "bullet" && sectionCount > 1;
                                                const showRemoveItem = !readOnly && scopes.length > 1 && isLast;
                                                const hasDeleteButton = showRemoveSection || showRemoveItem;
                                                const textareaClass = (index === 0 && !hasDeleteButton)
                                                    ? "aim-textarea-risk-create-ibra font-fam aim-textarea-text"
                                                    : "aim-textarea-risk-create-ibra font-fam aim-textarea-text-with-delete";

                                                return (
                                                    <>
                                                        <div className="aim-textarea-inner-wrap">
                                                            <textarea
                                                                spellCheck="true"
                                                                name={`purpose-background-${index}`}
                                                                className={textareaClass}
                                                                onChange={(e) => onChange(index, e.target.value)}
                                                                onFocus={() => onFocus?.(index)}
                                                                value={scope?.text || ""}
                                                                rows={1}
                                                                placeholder="Insert the purpose of this document and include any relevant background information regarding the topic."
                                                                readOnly={readOnly}
                                                            />

                                                            {!readOnly && (
                                                                <>
                                                                    {loadingIndex === index ? (
                                                                        <FontAwesomeIcon
                                                                            icon={faSpinner}
                                                                            className="aim-textarea-icon-ibra2 spin-animation"
                                                                        />
                                                                    ) : (
                                                                        <FontAwesomeIcon
                                                                            icon={faMagicWandSparkles}
                                                                            className="aim-textarea-icon-ibra2"
                                                                            title="AI Rewrite"
                                                                            style={{ fontSize: "15px" }}
                                                                            onClick={() => onAiRewrite(index)}
                                                                        />
                                                                    )}

                                                                    <FontAwesomeIcon
                                                                        icon={faRotateLeft}
                                                                        className="aim-textarea-icon-ibra2-undo"
                                                                        title="Undo AI Rewrite"
                                                                        onClick={() => onUndo(index)}
                                                                        style={{
                                                                            marginLeft: "8px",
                                                                            opacity: rewriteHistory?.aim?.[index]?.length ? 1 : 0.3,
                                                                            cursor: rewriteHistory?.aim?.[index]?.length ? "pointer" : "not-allowed",
                                                                            fontSize: "15px"
                                                                        }}
                                                                    />
                                                                </>
                                                            )}
                                                        </div>

                                                        {showRemoveSection && (
                                                            <button
                                                                type="button"
                                                                className="aim-textarea-delete-btn-inline"
                                                                title="Remove Section"
                                                                onClick={() => onRemoveScopeSection(index)}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        )}

                                                        {showRemoveItem && (
                                                            <button
                                                                type="button"
                                                                className="aim-textarea-delete-btn-inline"
                                                                title="Remove Purpose and Background"
                                                                onClick={() => onRemoveScope(index)}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        )}
                                                    </>
                                                );
                                            })()
                                        ) : (
                                            <div
                                                className={`aim-bullet-section-box ${!readOnly && scopes.length > 1 && isLast ? "aim-bullet-section-box-with-delete" : ""
                                                    }`}
                                            >
                                                {!readOnly && scopes.length > 1 && isLast && (
                                                    <button
                                                        type="button"
                                                        className="top-right-button-aim-delete"
                                                        title="Remove Purpose and Background"
                                                        onClick={() => onRemoveScope(index)}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                )}

                                                {bullets.map((bullet, bulletIndex) => {
                                                    const isFilled = (bullet?.text || "").trim() !== "";

                                                    return (
                                                        <div key={bullet.id} className="aim-bullet-row-wrap">
                                                            <span className={`aim-visual-bullet ${isFilled ? "filled" : "empty"}`}>
                                                                •
                                                            </span>

                                                            <textarea
                                                                ref={(el) => {
                                                                    bulletRefs.current[`${index}-${bulletIndex}`] = el;
                                                                }}
                                                                spellCheck="true"
                                                                name={`purpose-background-${index}-bullet-${bulletIndex}`}
                                                                className="aim-textarea-risk-create-ibra font-fam aim-textarea-bullet-single"
                                                                onChange={(e) => onBulletChange(index, bullet.id, e.target.value)}
                                                                onKeyDown={(e) => handleBulletKeyDown(e, index, bulletIndex)}
                                                                onFocus={() => onFocus?.(index)}
                                                                value={bullet?.text || ""}
                                                                rows={1}
                                                                style={{ minHeight: "0px", paddingRight: "10px" }}
                                                                placeholder="Insert the purpose of this document and include any relevant background information regarding the topic."
                                                                readOnly={readOnly}
                                                            />

                                                            {!readOnly && (
                                                                <div className="aim-bullet-actions">
                                                                    <button
                                                                        type="button"
                                                                        className="aim-bullet-inline-button"
                                                                        title={bullets.length > 1 ? "Remove Bullet" : "At least one bullet is required"}
                                                                        disabled={bullets.length <= 1}
                                                                        onClick={() => {
                                                                            if (bullets.length <= 1) return;
                                                                            onRemoveBullet(index, bullet.id);
                                                                        }}
                                                                        style={bullets.length <= 1 ? { opacity: 0.3, cursor: "not-allowed" } : undefined}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrash} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="aim-bullet-inline-button"
                                                                        title="Insert Bullet Below"
                                                                        onClick={() => onAddBullet(index, bulletIndex)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faCirclePlus} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        })}

                        {!readOnly && (
                            <div className="aim-add-button-wrap">
                                <button
                                    type="button"
                                    className="add-aim-button"
                                    onClick={onAddScope}
                                >
                                    {nextType === "bullet" ? "Add Bullets" : "Add Paragraph"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PurposeBackgroundComponent;