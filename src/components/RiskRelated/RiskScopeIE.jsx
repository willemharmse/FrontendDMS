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
import RiskAssessmentItemsDelete from "./RiskAssessmentItemsDelete";

const RiskScopeIE = ({
    readOnly,
    error,
    formData,
    setErrors,

    onIntroChange,

    onSectionChange,
    onSectionBulletChange,
    onSectionFocus,
    onAddSectionItem,
    onRemoveSectionItem,
    onRemoveSectionGroup,
    onAddSectionBullet,
    onRemoveSectionBullet,

    onHelp,

    loadingScope,
    loadingScopeRewriteIndex,
    loadingScopeI,
    loadingScopeIRewriteIndex,
    loadingScopeE,
    loadingScopeERewriteIndex,

    rewriteHistory,

    onAiRewriteScope,
    onAiRewriteScopeTextItem,
    onUndoScope,
    onUndoScopeTextItem,

    collapsible = false
}) => {
    const [collapsed, setCollapsed] = useState(true);
    const isCollapsed = collapsible ? collapsed : false;
    const bulletRefs = useRef({});
    const [confirmDelete, setConfirmDelete] = useState(null);

    const requestRemoveSectionGroup = (sectionKey, index) => {
        setConfirmDelete({
            type: "Scope Section",
            specialText: "Are you sure you want to delete this paragraph and its bullets section?",
            action: () => onRemoveSectionGroup(sectionKey, index)
        });
    };

    const requestRemoveSectionItem = (sectionKey, index, specialText) => {
        setConfirmDelete({ type: "Item", specialText, action: () => onRemoveSectionItem(sectionKey, index) });
    };

    const requestRemoveSectionBullet = (sectionKey, itemIndex, bulletId) => {
        setConfirmDelete({ type: "Bullet", action: () => onRemoveSectionBullet(sectionKey, itemIndex, bulletId) });
    };

    const confirmRemove = () => {
        if (confirmDelete?.action) {
            confirmDelete.action();
        }
        setConfirmDelete(null);
    };

    const cancelRemove = () => {
        setConfirmDelete(null);
    };

    const toggleCollapse = () => {
        setCollapsed(prev => !prev);
    };

    const clearScopeError = () => {
        setErrors(prev => ({
            ...prev,
            scope: false
        }));
    };

    const handleIntroFocus = () => {
        clearScopeError();
        onSectionFocus?.("scope");
    };

    const getSectionMeta = (sectionKey) => {
        if (sectionKey === "scopeInclusions") {
            return {
                label: "Inclusions",
                placeholderText: "Insert scope inclusions text.",
                placeholderBullet: "List the specific items, activities, or areas covered in this risk assessment.",
                sectionLoading: loadingScopeI,
                activeRewriteIndex: loadingScopeIRewriteIndex,
                history: rewriteHistory?.scopeInclusions || []
            };
        }

        return {
            label: "Exclusions",
            placeholderText: "Insert scope exclusions text.",
            placeholderBullet: "List the specific items, activities, or areas not covered in this risk assessment.",
            sectionLoading: loadingScopeE,
            activeRewriteIndex: loadingScopeERewriteIndex,
            history: rewriteHistory?.scopeExclusions || []
        };
    };

    const handleBulletKeyDown = (e, sectionKey, itemIndex, bulletIndex) => {
        if (e.key === "Enter") {
            e.preventDefault();

            onAddSectionBullet(sectionKey, itemIndex, bulletIndex);

            setTimeout(() => {
                const nextKey = `${sectionKey}-${itemIndex}-${bulletIndex + 1}`;
                const nextTextarea = bulletRefs.current[nextKey];
                if (nextTextarea) {
                    nextTextarea.focus();
                }
            }, 0);
        }
    };

    const renderStructuredSection = (sectionKey, items = []) => {
        const meta = getSectionMeta(sectionKey);
        const safeItems = Array.isArray(items) && items.length > 0
            ? items
            : [{ type: "text", text: "" }];

        const lastType = safeItems?.length ? safeItems[safeItems.length - 1]?.type : "text";
        const nextType = lastType === "text" ? "bullet" : "text";
        const sectionCount = safeItems.filter((item) => item?.type === "text").length;

        return (
            <div className="risk-scope-stack-group">
                <div className="risk-scope-stack-column">
                    <label className="scope-risk-label">{meta.label}</label>

                    <div className="risk-scope-structured-layout">
                        {safeItems.map((item, index) => {
                            const isLast = index === safeItems.length - 1;
                            const isTextType = (item?.type || "text") === "text";
                            const bullets = Array.isArray(item?.bullets) ? item.bullets : [];
                            const textHistory = Array.isArray(meta.history?.[index]) ? meta.history[index] : [];
                            const isItemLoading = meta.activeRewriteIndex === index;

                            return (
                                <div key={index} className="risk-scope-structured-item">
                                    {isTextType ? (
                                        (() => {
                                            const showRemoveSection = !readOnly && safeItems[index + 1]?.type === "bullet" && sectionCount > 1;
                                            const showRemoveItem = !readOnly && safeItems.length > 1 && isLast;
                                            const hasDeleteButton = showRemoveSection || showRemoveItem;
                                            const textareaClass = (index === 0 && !hasDeleteButton)
                                                ? "aim-textarea-risk-scope font-fam risk-scope-paragraph-textarea"
                                                : "aim-textarea-risk-scope font-fam risk-scope-paragraph-textarea-with-delete";

                                            return (
                                                <div className="risk-scope-text-block">
                                                    <div className="risk-scope-textarea-inner-wrap">
                                                        <textarea
                                                            spellCheck="true"
                                                            className={textareaClass}
                                                            value={item?.text || ""}
                                                            onChange={(e) => onSectionChange(sectionKey, index, e.target.value)}
                                                            onFocus={() => {
                                                                clearScopeError();
                                                                onSectionFocus?.(sectionKey, index);
                                                            }}
                                                            rows={5}
                                                            placeholder={meta.placeholderText}
                                                            readOnly={readOnly}
                                                        />

                                                        {!readOnly && (
                                                            <>
                                                                {isItemLoading ? (
                                                                    <FontAwesomeIcon
                                                                        icon={faSpinner}
                                                                        className="scope-textarea-icon spin-animation"
                                                                    />
                                                                ) : (
                                                                    <FontAwesomeIcon
                                                                        icon={faMagicWandSparkles}
                                                                        className="scope-textarea-icon"
                                                                        title={`AI Rewrite ${meta.label}`}
                                                                        style={{ fontSize: "15px" }}
                                                                        onClick={() => onAiRewriteScopeTextItem(sectionKey, index)}
                                                                    />
                                                                )}

                                                                <FontAwesomeIcon
                                                                    icon={faRotateLeft}
                                                                    className="scope-textarea-icon-undo"
                                                                    title={`Undo AI Rewrite ${meta.label}`}
                                                                    onClick={() => onUndoScopeTextItem(sectionKey, index)}
                                                                    style={{
                                                                        marginLeft: "8px",
                                                                        opacity: textHistory.length ? 1 : 0.3,
                                                                        cursor: textHistory.length ? "pointer" : "not-allowed",
                                                                        fontSize: "15px"
                                                                    }}
                                                                />
                                                            </>
                                                        )}
                                                    </div>

                                                    {showRemoveSection && (
                                                        <button
                                                            type="button"
                                                            className="risk-scope-delete-btn-inline"
                                                            title="Remove Section"
                                                            onClick={() => requestRemoveSectionGroup(sectionKey, index)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    )}

                                                    {showRemoveItem && (
                                                        <button
                                                            type="button"
                                                            className="risk-scope-delete-btn-inline"
                                                            title="Remove Item"
                                                            onClick={() => requestRemoveSectionItem(sectionKey, index, "Are you sure you want to delete this paragraph section?")}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className={`risk-scope-bullet-box ${!readOnly && safeItems.length > 1 && isLast ? "risk-scope-bullet-box-with-delete" : ""}`}>
                                            {!readOnly && safeItems.length > 1 && isLast && (
                                                <button
                                                    type="button"
                                                    className="risk-scope-delete-item-button"
                                                    title={`Remove Bullets`}
                                                    onClick={() => requestRemoveSectionItem(sectionKey, index, "Are you sure you want to delete this bullet section?")}
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
                                                                bulletRefs.current[`${sectionKey}-${index}-${bulletIndex}`] = el;
                                                            }}
                                                            spellCheck="true"
                                                            className="aim-bullet-textarea-risk-create-ibra font-fam aim-textarea-bullet-single"
                                                            value={bullet?.text || ""}
                                                            onChange={(e) =>
                                                                onSectionBulletChange(sectionKey, index, bullet.id, e.target.value)
                                                            }
                                                            onKeyDown={(e) =>
                                                                handleBulletKeyDown(e, sectionKey, index, bulletIndex)
                                                            }
                                                            onFocus={() => {
                                                                clearScopeError();
                                                                onSectionFocus?.(sectionKey, index);
                                                            }}
                                                            rows={1}
                                                            style={{ minHeight: "0px" }}
                                                            placeholder={meta.placeholderBullet}
                                                            readOnly={readOnly}
                                                        />

                                                        {!readOnly && (
                                                            <div className="aim-bullet-actions-scope-ie">

                                                                <button
                                                                    type="button"
                                                                    className="aim-bullet-inline-button"
                                                                    title={bullets.length > 1 ? "Remove Bullet" : "At least one bullet is required"}
                                                                    disabled={bullets.length <= 1}
                                                                    onClick={() => {
                                                                        if (bullets.length <= 1) return;
                                                                        requestRemoveSectionBullet(sectionKey, index, bullet.id);
                                                                    }}
                                                                    style={bullets.length <= 1 ? { opacity: 0.3, cursor: "not-allowed" } : undefined}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="aim-bullet-inline-button"
                                                                    title="Insert Bullet Below"
                                                                    onClick={() => onAddSectionBullet(sectionKey, index, bulletIndex)}
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
                            );
                        })}
                    </div>

                    {!readOnly && (
                        <div className="aim-add-button-wrap">
                            <button
                                type="button"
                                className="add-scope-bullets-button"
                                onClick={() => onAddSectionItem(sectionKey)}
                            >
                                {nextType === "bullet" ? `Add Bullets` : `Add Paragraph`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="input-row-risk-create">
            <div className={`input-box-aim-risk-scope ${error ? "error-create" : ""}`}>
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
                    Scope <span className="required-field">*</span>
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
                    <div className="risk-scope-stack-layout">
                        <div className="risk-scope-stack-group">
                            <div className="risk-scope-stack-column">
                                <label className="scope-risk-label">Introduction</label>
                                <textarea
                                    lang="en-ZA"
                                    spellCheck="true"
                                    name="scope"
                                    className="aim-textarea-risk-scope-2 font-fam"
                                    onChange={onIntroChange}
                                    value={formData.scope}
                                    rows="5"
                                    placeholder="Insert a brief scope introduction (General scope notes and comments)."
                                    onFocus={handleIntroFocus}
                                    readOnly={readOnly}
                                />

                                {!readOnly && (
                                    <>
                                        {loadingScope ? (
                                            <FontAwesomeIcon
                                                icon={faSpinner}
                                                className="scope-textarea-icon spin-animation"
                                            />
                                        ) : (
                                            <FontAwesomeIcon
                                                icon={faMagicWandSparkles}
                                                className="scope-textarea-icon"
                                                title="AI Rewrite Intro"
                                                style={{ fontSize: "15px" }}
                                                onClick={onAiRewriteScope}
                                            />
                                        )}

                                        <FontAwesomeIcon
                                            icon={faRotateLeft}
                                            className="scope-textarea-icon-undo"
                                            title="Undo AI Rewrite Intro"
                                            onClick={onUndoScope}
                                            style={{
                                                marginLeft: "8px",
                                                opacity: rewriteHistory?.scope?.length ? 1 : 0.3,
                                                cursor: rewriteHistory?.scope?.length ? "pointer" : "not-allowed",
                                                fontSize: "15px"
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        {renderStructuredSection("scopeInclusions", formData.scopeInclusions)}
                        {renderStructuredSection("scopeExclusions", formData.scopeExclusions)}
                    </div>
                )}
            </div>

            {confirmDelete && (
                <RiskAssessmentItemsDelete
                    closeModal={cancelRemove}
                    type={confirmDelete.type}
                    specialText={confirmDelete.specialText}
                    removeRow={confirmRemove}
                />
            )}
        </div>
    );
};

export default RiskScopeIE;