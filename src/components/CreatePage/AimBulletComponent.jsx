import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faInfoCircle,
    faMagicWandSparkles,
    faRotateLeft,
    faSpinner,
    faTrash,
    faPlus,
    faCirclePlus,
    faChevronDown,
    faChevronUp
} from "@fortawesome/free-solid-svg-icons";

const AimBulletComponent = ({
    readOnly,
    aims = [{ type: "text", text: "" }],
    errors = [],
    loadingIndex = null,
    rewriteHistory,
    onChange,
    onBulletChange,
    onFocus,
    onHelp,
    onAiRewrite,
    onUndo,
    onAddAim,
    onRemoveAim,
    onRemoveAimSection,
    onAddBullet,
    onRemoveBullet,
    collapsible = false,
    type = "procedure"
}) => {
    const [collapsed, setCollapsed] = useState(true);
    const isCollapsed = collapsible ? collapsed : false;
    const lastType = aims?.length ? aims[aims.length - 1]?.type : "text";
    const nextType = lastType === "text" ? "bullet" : "text";
    const sectionCount = aims.filter((item) => item?.type === "text").length;
    const bulletRefs = useRef({});

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
    };

    const handleBulletKeyDown = (e, aimIndex, bulletIndex) => {
        if (e.key === "Enter") {
            e.preventDefault();

            onAddBullet(aimIndex, bulletIndex);

            // wait for React render
            setTimeout(() => {
                const nextKey = `${aimIndex}-${bulletIndex + 1}`;
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
                    Aim <span className="required-field">*</span>
                </h3>

                {collapsible && (<button
                    className="top-right-button-ibra"
                    title={collapsed ? "Expand Section" : "Collapse Section"}
                    onClick={toggleCollapse}
                    style={{ color: "gray" }}
                    type="button"
                >
                    <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
                </button>)}

                {(!isCollapsed) && (
                    <>
                        {
                            aims.map((aim, index) => {
                                const isLast = index === aims.length - 1;
                                const hasError = !!errors[index];
                                const isTextType = (aim?.type || "text") === "text";
                                const isBulletType = aim?.type === "bullet";
                                const bullets = Array.isArray(aim?.bullets) ? aim.bullets : [];

                                return (
                                    <React.Fragment key={index}>
                                        <div className={`aim-textarea-stack-item ${hasError ? "error-create" : ""}`}>
                                            {isTextType ? (
                                                (() => {
                                                    const showRemoveSection = !readOnly && aims[index + 1]?.type === "bullet" && sectionCount > 1;
                                                    const showRemoveItem = !readOnly && aims.length > 1 && isLast;
                                                    const hasDeleteButton = showRemoveSection || showRemoveItem;
                                                    const textareaClass = (index === 0 && !hasDeleteButton)
                                                        ? "aim-textarea-risk-create-ibra font-fam aim-textarea-text"
                                                        : "aim-textarea-risk-create-ibra font-fam aim-textarea-text-with-delete";

                                                    return (
                                                        <>
                                                            <div className="aim-textarea-inner-wrap">
                                                                <textarea
                                                                    spellCheck="true"
                                                                    name={`aim-${index}`}
                                                                    className={textareaClass}
                                                                    onChange={(e) => onChange(index, e.target.value)}
                                                                    onFocus={() => onFocus?.(index)}
                                                                    value={aim?.text || ""}
                                                                    rows={1}
                                                                    placeholder={`Clearly state the goal of the ${type}, focusing on what the ${type} intends to achieve or address. Keep it specific, relevant, and outcome-driven.`}
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
                                                                    onClick={() => onRemoveAimSection(index)}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                            )}

                                                            {showRemoveItem && (
                                                                <button
                                                                    type="button"
                                                                    className="aim-textarea-delete-btn-inline"
                                                                    title="Remove Aim"
                                                                    onClick={() => onRemoveAim(index)}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                            )}
                                                        </>
                                                    );
                                                })()
                                            ) : (
                                                <div
                                                    className={`aim-bullet-section-box ${!readOnly && aims.length > 1 && isLast ? "aim-bullet-section-box-with-delete" : ""
                                                        }`}
                                                >
                                                    {!readOnly && aims.length > 1 && isLast && (
                                                        <button
                                                            type="button"
                                                            className="top-right-button-aim-delete"
                                                            title="Remove Aim"
                                                            onClick={() => onRemoveAim(index)}
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
                                                                    name={`aim-${index}-bullet-${bulletIndex}`}
                                                                    className="aim-textarea-risk-create-ibra font-fam aim-textarea-bullet-single"
                                                                    onChange={(e) => onBulletChange(index, bullet.id, e.target.value)}
                                                                    onKeyDown={(e) => handleBulletKeyDown(e, index, bulletIndex)}
                                                                    onFocus={() => onFocus?.(index)}
                                                                    value={bullet?.text || ""}
                                                                    rows={1}
                                                                    style={{ minHeight: "0px", paddingRight: "10px" }}
                                                                    placeholder={`Clearly state a key point related to the aim of the ${type}.`}
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
                                    onClick={onAddAim}
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

export default AimBulletComponent;