import React, { useMemo, useRef, useState } from "react";
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
import { v4 as uuidv4 } from "uuid";
import ExecutiveSummaryInfo from "./RiskInfo/ExecutiveSummaryInfo";
import "../RiskAssessmentPages/RiskManagementPage.css";

const createExecBulletRow = () => ({
    id: uuidv4(),
    text: ""
});

const ExecutiveSummary = ({
    readOnly = false,
    error,
    formData,
    setFormData,
    setErrors,
    collapsible = false
}) => {
    const [collapsed, setCollapsed] = useState(true);
    const [helpES, setHelpES] = useState(false);
    const [aiRewriteInProgress, setAiRewriteInProgress] = useState(false);
    const [loadingRewriteIndex, setLoadingRewriteIndex] = useState(null);
    const [rewriteHistory, setRewriteHistory] = useState({
        execSummary: {}
    });

    const bulletRefs = useRef({});
    const isCollapsed = collapsible ? collapsed : false;

    const toggleCollapse = () => {
        setCollapsed(prev => !prev);
    };

    const hasGeneratedSummary = formData.execSummaryGen !== "";

    const introItems = useMemo(() => {
        const value = formData.execSummary;

        if (Array.isArray(value) && value.length > 0) {
            return value.map((item) => {
                const type = item?.type === "bullet" ? "bullet" : "text";

                if (type === "text") {
                    return {
                        type: "text",
                        text: item?.text || ""
                    };
                }

                const bullets = Array.isArray(item?.bullets)
                    ? item.bullets.map((b) => ({
                        id: b?.id || uuidv4(),
                        text: b?.text || ""
                    }))
                    : String(item?.text || "")
                        .split(/\r?\n/)
                        .map(line => line.trim())
                        .filter(Boolean)
                        .map(line => ({
                            id: uuidv4(),
                            text: line
                        }));

                return {
                    type: "bullet",
                    bullets: bullets.length > 0 ? bullets : [createExecBulletRow()],
                    text: bullets.map(b => b.text).join("\n")
                };
            });
        }

        if (typeof value === "string" && value.trim() !== "") {
            return [{ type: "text", text: value }];
        }

        return [{ type: "text", text: "" }];
    }, [formData.execSummary]);

    const priorityEvents = useMemo(() => {
        if (!hasGeneratedSummary) return [];

        return [...(formData.ibra || [])]
            .sort((a, b) => {
                const getRankNumber = (r) => {
                    const match = r.riskRank?.match(/^(\d+)/);
                    return match ? parseInt(match[1], 10) : 0;
                };
                return getRankNumber(b) - getRankNumber(a);
            })
            .filter(r => r.priority === "Yes")
            .map(r => r.UE)
            .filter(Boolean);
    }, [formData.ibra, hasGeneratedSummary]);

    const materialEvents = useMemo(() => {
        if (!hasGeneratedSummary) return [];

        return [...(formData.ibra || [])]
            .sort((a, b) => {
                const getRankNumber = (r) => {
                    const match = r.riskRank?.match(/^(\d+)/);
                    return match ? parseInt(match[1], 10) : 0;
                };
                return getRankNumber(b) - getRankNumber(a);
            })
            .filter(r => r.material === "Yes")
            .map(r => r.UE)
            .filter(Boolean);
    }, [formData.ibra, hasGeneratedSummary]);

    const pushRewriteHistory = (index, oldValue) => {
        setRewriteHistory(prev => ({
            ...prev,
            execSummary: {
                ...prev.execSummary,
                [index]: [...(prev.execSummary[index] || []), oldValue]
            }
        }));
    };

    const undoAiRewrite = (index) => {
        setRewriteHistory(prev => {
            const currentHistory = [...(prev.execSummary[index] || [])];
            if (currentHistory.length === 0) return prev;

            const lastValue = currentHistory.pop();

            setFormData(current => ({
                ...current,
                execSummary: introItems.map((item, i) =>
                    i === index ? { ...item, text: lastValue } : item
                )
            }));

            return {
                ...prev,
                execSummary: {
                    ...prev.execSummary,
                    [index]: currentHistory
                }
            };
        });
    };

    const handleGenerateSummary = () => {
        setFormData(prev => ({
            ...prev,
            execSummaryGen: "Executive Summary generated successfully.",
            execSummary: Array.isArray(prev.execSummary) && prev.execSummary.length > 0
                ? prev.execSummary
                : [{ type: "text", text: "" }]
        }));
    };

    const clearError = () => {
        setErrors?.(prev => ({
            ...prev,
            execSummary: false
        }));
    };

    const handleTextChange = (index, value) => {
        clearError();

        setFormData(prev => ({
            ...prev,
            execSummary: introItems.map((item, i) =>
                i === index ? { ...item, text: value } : item
            )
        }));
    };

    const handleBulletChange = (itemIndex, bulletId, value) => {
        clearError();

        setFormData(prev => ({
            ...prev,
            execSummary: introItems.map((item, i) => {
                if (i !== itemIndex || item?.type !== "bullet") return item;

                const updatedBullets = (item.bullets || []).map((bullet) =>
                    bullet.id === bulletId ? { ...bullet, text: value } : bullet
                );

                return {
                    ...item,
                    bullets: updatedBullets
                };
            })
        }));
    };

    const handleAddSectionItem = () => {
        setFormData(prev => {
            const currentItems = Array.isArray(prev.execSummary) && prev.execSummary.length > 0
                ? prev.execSummary
                : [{ type: "text", text: "" }];

            const lastType = currentItems[currentItems.length - 1]?.type || "text";
            const nextType = lastType === "text" ? "bullet" : "text";

            return {
                ...prev,
                execSummary: [
                    ...currentItems,
                    nextType === "bullet"
                        ? { type: "bullet", bullets: [createExecBulletRow()], text: "" }
                        : { type: "text", text: "" }
                ]
            };
        });
    };

    const handleRemoveSectionItem = (indexToRemove) => {
        setFormData(prev => {
            const currentItems = Array.isArray(prev.execSummary) ? prev.execSummary : [];
            const updatedItems = currentItems.filter((_, index) => index !== indexToRemove);

            return {
                ...prev,
                execSummary: updatedItems.length > 0 ? updatedItems : [{ type: "text", text: "" }]
            };
        });
    };

    const handleRemoveSectionGroup = (textIndex) => {
        setFormData(prev => {
            const currentItems = Array.isArray(prev.execSummary) ? prev.execSummary : [];

            const sectionStartIndexes = currentItems
                .map((item, index) => (item?.type === "text" ? index : null))
                .filter(index => index !== null);

            if (sectionStartIndexes.length <= 1) {
                return prev;
            }

            const updatedItems = currentItems.filter((_, index) => {
                return index !== textIndex && index !== textIndex + 1;
            });

            return {
                ...prev,
                execSummary: updatedItems.length > 0 ? updatedItems : [{ type: "text", text: "" }]
            };
        });
    };

    const handleAddBullet = (itemIndex, insertAtIndex = null) => {
        setFormData(prev => ({
            ...prev,
            execSummary: introItems.map((item, i) => {
                if (i !== itemIndex || item?.type !== "bullet") return item;

                const currentBullets = Array.isArray(item.bullets) ? item.bullets : [];
                const newBullet = createExecBulletRow();

                if (insertAtIndex === null || insertAtIndex < 0 || insertAtIndex > currentBullets.length) {
                    return {
                        ...item,
                        bullets: [...currentBullets, newBullet]
                    };
                }

                return {
                    ...item,
                    bullets: [
                        ...currentBullets.slice(0, insertAtIndex + 1),
                        newBullet,
                        ...currentBullets.slice(insertAtIndex + 1)
                    ]
                };
            })
        }));
    };

    const handleRemoveBullet = (itemIndex, bulletId) => {
        setFormData(prev => ({
            ...prev,
            execSummary: introItems.map((item, i) => {
                if (i !== itemIndex || item?.type !== "bullet") return item;

                const updatedBullets = (item.bullets || []).filter(
                    (bullet) => bullet.id !== bulletId
                );

                return {
                    ...item,
                    bullets: updatedBullets
                };
            })
        }));
    };

    const handleBulletKeyDown = (e, itemIndex, bulletIndex) => {
        if (e.key === "Enter") {
            e.preventDefault();

            handleAddBullet(itemIndex, bulletIndex);

            setTimeout(() => {
                const nextKey = `${itemIndex}-${bulletIndex + 1}`;
                const nextTextarea = bulletRefs.current[nextKey];
                if (nextTextarea) {
                    nextTextarea.focus();
                }
            }, 0);
        }
    };

    const handleAiRewrite = async (index) => {
        try {
            const item = introItems[index];

            if (!item || item.type !== "text" || !item.text?.trim()) return;

            pushRewriteHistory(index, item.text);
            setAiRewriteInProgress(true);
            setLoadingRewriteIndex(index);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/execSummary/ibra`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ prompt: item.text }),
            });

            const data = await response.json();
            const newText = data?.response || "";

            setFormData(prev => ({
                ...prev,
                execSummary: introItems.map((row, i) =>
                    i === index ? { ...row, text: newText } : row
                )
            }));
        } catch (error) {
            console.error("Error saving data:", error);
        } finally {
            setAiRewriteInProgress(false);
            setLoadingRewriteIndex(null);
        }
    };

    const lastType = introItems?.length ? introItems[introItems.length - 1]?.type : "text";
    const nextType = lastType === "text" ? "bullet" : "text";
    const sectionCount = introItems.filter((item) => item?.type === "text").length;

    return (
        <>
            {(["IBRA", "BLRA"].includes(formData.documentType)) && (
                <div className="input-row-risk-create">
                    <div className={`input-box-aim-risk-scope ${error ? "error-create" : ""}`}>
                        <button
                            className="top-left-button-refs"
                            title="Information"
                            type="button"
                            onClick={() => setHelpES(true)}
                        >
                            <FontAwesomeIcon
                                icon={faInfoCircle}
                                style={{ cursor: "pointer" }}
                                className="icon-um-search"
                            />
                        </button>

                        <h3 className="font-fam-labels">Executive Summary</h3>

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
                                {hasGeneratedSummary ? (
                                    <div className="risk-scope-stack-group">
                                        <div className="risk-scope-stack-column">
                                            <label className="scope-risk-label">Introduction</label>

                                            <div className="risk-scope-structured-layout">
                                                {introItems.map((item, index) => {
                                                    const isLast = index === introItems.length - 1;
                                                    const isTextType = (item?.type || "text") === "text";
                                                    const bullets = Array.isArray(item?.bullets) ? item.bullets : [];
                                                    const textHistory = Array.isArray(rewriteHistory?.execSummary?.[index])
                                                        ? rewriteHistory.execSummary[index]
                                                        : [];
                                                    const isItemLoading = loadingRewriteIndex === index;

                                                    return (
                                                        <div key={index} className="risk-scope-structured-item">
                                                            {isTextType ? (
                                                                <div className="risk-scope-text-block">
                                                                    {!readOnly && (() => {
                                                                        const showRemoveSection = introItems[index + 1]?.type === "bullet" && sectionCount > 1;
                                                                        const showRemoveItem = introItems.length > 1 && isLast;

                                                                        if (!showRemoveSection && !showRemoveItem) return null;

                                                                        return (
                                                                            <button
                                                                                type="button"
                                                                                className="risk-scope-delete-item-button"
                                                                                title={showRemoveSection ? "Remove Section" : "Remove Item"}
                                                                                onClick={() =>
                                                                                    showRemoveSection
                                                                                        ? handleRemoveSectionGroup(index)
                                                                                        : handleRemoveSectionItem(index)
                                                                                }
                                                                            >
                                                                                <FontAwesomeIcon icon={faTrash} />
                                                                            </button>
                                                                        );
                                                                    })()}

                                                                    <textarea
                                                                        spellCheck="true"
                                                                        className="aim-textarea-risk-scope-inclu-exclu font-fam risk-scope-paragraph-textarea"
                                                                        value={item?.text || ""}
                                                                        onChange={(e) => handleTextChange(index, e.target.value)}
                                                                        onFocus={clearError}
                                                                        rows={5}
                                                                        placeholder="The automatically generated summary below serves as a starting point to help you draft the introduction of the executive summary. Please insert any other important information or additional notes here."
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
                                                                                    title="AI Rewrite Introduction"
                                                                                    style={{ fontSize: "15px" }}
                                                                                    onClick={() => handleAiRewrite(index)}
                                                                                />
                                                                            )}

                                                                            <FontAwesomeIcon
                                                                                icon={faRotateLeft}
                                                                                className="scope-textarea-icon-undo"
                                                                                title="Undo AI Rewrite Introduction"
                                                                                onClick={() => undoAiRewrite(index)}
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
                                                            ) : (
                                                                <div className={`risk-scope-bullet-box ${!readOnly && introItems.length > 1 && isLast ? "risk-scope-bullet-box-with-delete" : ""}`}>
                                                                    {!readOnly && introItems.length > 1 && isLast && (
                                                                        <button
                                                                            type="button"
                                                                            className="risk-scope-delete-item-button"
                                                                            title="Remove Bullets"
                                                                            onClick={() => handleRemoveSectionItem(index)}
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
                                                                                    className="aim-textarea-risk-create-textarea-nopads font-fam aim-textarea-bullet-single"
                                                                                    value={bullet?.text || ""}
                                                                                    onChange={(e) => handleBulletChange(index, bullet.id, e.target.value)}
                                                                                    onKeyDown={(e) => handleBulletKeyDown(e, index, bulletIndex)}
                                                                                    onFocus={clearError}
                                                                                    rows={1}
                                                                                    style={{ minHeight: "0px" }}
                                                                                    placeholder="Clearly state a key point related to the executive summary introduction."
                                                                                    readOnly={readOnly}
                                                                                />

                                                                                {!readOnly && (
                                                                                    <div className="aim-bullet-actions">
                                                                                        {bullets.length > 1 && (
                                                                                            <button
                                                                                                type="button"
                                                                                                className="aim-bullet-inline-button"
                                                                                                title="Remove Bullet"
                                                                                                onClick={() => handleRemoveBullet(index, bullet.id)}
                                                                                            >
                                                                                                <FontAwesomeIcon icon={faTrash} />
                                                                                            </button>
                                                                                        )}

                                                                                        <button
                                                                                            type="button"
                                                                                            className="aim-bullet-inline-button"
                                                                                            title="Insert Bullet Below"
                                                                                            onClick={() => handleAddBullet(index, bulletIndex)}
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
                                                        onClick={handleAddSectionItem}
                                                    >
                                                        {nextType === "bullet" ? "Add Bullets" : "Add Paragraph"}
                                                    </button>
                                                </div>
                                            )}

                                            <div className="exec-summary-notes-block">
                                                <p className="exec-summary-notes-title">
                                                    <strong>The following notes will be displayed in the report:</strong>
                                                </p>

                                                <p className="exec-summary-notes-copy">
                                                    The <strong>Priority Unwanted Events (PUEs)</strong> identified in this risk assessment are (from the highest to the lowest rating):
                                                </p>

                                                <ul className="exec-summary-notes-list">
                                                    {priorityEvents.length > 0 ? (
                                                        priorityEvents.map((event, index) => (
                                                            <li key={`pue-${index}`}>{event}.</li>
                                                        ))
                                                    ) : (
                                                        <li>No priority events identified.</li>
                                                    )}
                                                </ul>

                                                <p className="exec-summary-notes-copy">
                                                    The <strong>Material Unwanted Events (MUEs)</strong> identified in this risk assessment are (from the highest to the lowest rating):
                                                </p>

                                                <ul className="exec-summary-notes-list">
                                                    {materialEvents.length > 0 ? (
                                                        materialEvents.map((event, index) => (
                                                            <li key={`mue-${index}`}>{event}.</li>
                                                        ))
                                                    ) : (
                                                        <li>No material events identified.</li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    !readOnly && (
                                        <button
                                            className="add-row-button-ref"
                                            onClick={handleGenerateSummary}
                                            type="button"
                                        >
                                            Generate
                                        </button>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {helpES && <ExecutiveSummaryInfo setClose={() => setHelpES(false)} />}
        </>
    );
};

export default ExecutiveSummary;