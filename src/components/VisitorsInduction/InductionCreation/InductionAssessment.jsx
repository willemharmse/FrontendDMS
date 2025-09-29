import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle, faCopy, faChevronDown } from '@fortawesome/free-solid-svg-icons';

const InductionAssessment = ({ formData, setFormData }) => {
    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            assessment: [
                ...prev.assessment,
                { id: crypto.randomUUID(), question: "", answer: "", options: ["", "", ""], collapsed: false }
            ]
        }));
    };

    // ✅ Prevent removing the last remaining question
    const removeQuestion = (qid) => {
        setFormData(prev => {
            const list = prev.assessment || [];
            if (list.length <= 1) return prev; // keep at least one question
            return {
                ...prev,
                assessment: list.filter(q => q.id !== qid)
            };
        });
    };

    const updateQuestionText = (qid, text) => {
        setFormData(prev => ({
            ...prev,
            assessment: prev.assessment.map(q =>
                q.id === qid ? { ...q, question: text } : q
            )
        }));
    };

    const setCorrectAnswer = (qid, optIndex) => {
        setFormData(prev => ({
            ...prev,
            assessment: prev.assessment.map(q =>
                q.id === qid ? { ...q, answer: String(optIndex) } : q
            )
        }));
    };

    const updateOptionText = (qid, optIndex, text) => {
        setFormData(prev => ({
            ...prev,
            assessment: prev.assessment.map(q => {
                if (q.id !== qid) return q;
                const opts = [...(q.options || [])];
                opts[optIndex] = text;
                return { ...q, options: opts };
            })
        }));
    };

    const addOption = (qid, afterIndex) => {
        setFormData(prev => ({
            ...prev,
            assessment: prev.assessment.map(q => {
                if (q.id !== qid) return q;
                const opts = [...(q.options || [])];
                opts.splice(afterIndex + 1, 0, "");
                return { ...q, options: opts };
            })
        }));
    };

    const removeOption = (qid, optIndex) => {
        setFormData(prev => ({
            ...prev,
            assessment: prev.assessment.map(q => {
                if (q.id !== qid) return q;
                const opts = [...(q.options || [])];
                if (opts.length <= 1) return q; // keep at least one option
                opts.splice(optIndex, 1);
                const newAnswer = q.answer === String(optIndex) ? "" : q.answer;
                return { ...q, options: opts, answer: newAnswer };
            })
        }));
    };

    const onlyOneQuestionLeft = (formData.assessment?.length || 0) <= 1;

    return (
        <div className="input-row">
            <div className={`input-box-ref`}>
                <h3 className="font-fam-labels">Assessment</h3>

                {formData.assessment.map((question, index) => (
                    <div
                        className={`course-ass-file-card ${question.collapsed ? "course-ass-file-is-collapsed" : ""}`}
                        key={question.id}
                    >
                        <div className="course-ass-file-card-header">
                            <div className="course-ass-file-header-left">
                                <button
                                    type="button"
                                    className="course-ass-file-collapse-btn"
                                    aria-label={question.collapsed ? "Expand options" : "Collapse options"}
                                    onClick={() =>
                                        setFormData(prev => ({
                                            ...prev,
                                            assessment: prev.assessment.map(q =>
                                                q.id === question.id ? { ...q, collapsed: !q.collapsed } : q
                                            )
                                        }))
                                    }
                                >
                                    <FontAwesomeIcon icon={faChevronDown} />
                                </button>
                                <div className="course-ass-file-qtitle">Question {index + 1}</div>
                            </div>

                            <div className="course-ass-file-qactions">
                                <button
                                    className="course-ass-file-icon-btn"
                                    aria-label="Remove question"
                                    title={onlyOneQuestionLeft ? "At least one question is required" : "Remove question"}
                                    onClick={() => removeQuestion(question.id)}
                                    type="button"
                                    disabled={onlyOneQuestionLeft}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>

                                {/* Duplicate question */}
                                <button
                                    className="course-ass-file-icon-btn"
                                    aria-label="Duplicate question"
                                    type="button"
                                    onClick={() =>
                                        setFormData(prev => {
                                            const list = [...prev.assessment];
                                            const idx = list.findIndex(q => q.id === question.id);
                                            const copy = {
                                                id: crypto.randomUUID(),
                                                question: question.question,
                                                answer: question.answer,
                                                options: [...(question.options || [])],
                                                collapsed: false
                                            };
                                            list.splice(idx + 1, 0, copy);
                                            return { ...prev, assessment: list };
                                        })
                                    }
                                >
                                    <FontAwesomeIcon icon={faCopy} />
                                </button>

                                <button
                                    className="course-ass-file-icon-btn"
                                    aria-label="Add question"
                                    onClick={addQuestion}
                                    type="button"
                                >
                                    <FontAwesomeIcon icon={faPlusCircle} />
                                </button>
                            </div>
                        </div>

                        <div className="course-ass-file-qbody">
                            <textarea
                                className="course-ass-file-question-input"
                                placeholder="Insert Question"
                                value={question.question}
                                onChange={(e) => updateQuestionText(question.id, e.target.value)}
                            />

                            <div className="course-ass-file-options">
                                {(question.options || []).map((opt, optIndex) => (
                                    <div className="course-ass-file-option-row" key={`${question.id}-${optIndex}`}>
                                        <div className="course-ass-file-radio-wrap">
                                            <input
                                                type="radio"
                                                name={`q-${question.id}`}
                                                checked={String(optIndex) === String(question.answer)}
                                                onChange={() => setCorrectAnswer(question.id, optIndex)}
                                            />
                                        </div>

                                        <input
                                            type="text"
                                            className="course-ass-file-option-input"
                                            placeholder={`Insert Option ${optIndex + 1}`}
                                            value={opt}
                                            onChange={(e) => updateOptionText(question.id, optIndex, e.target.value)}
                                        />

                                        <div className="course-ass-file-option-actions">
                                            <button
                                                className="course-ass-file-icon-btn"
                                                aria-label="Remove option"
                                                onClick={() => removeOption(question.id, optIndex)}
                                                type="button"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                            <button
                                                className="course-ass-file-icon-btn"
                                                aria-label="Add option"
                                                onClick={() => addOption(question.id, optIndex)}
                                                type="button"
                                            >
                                                <FontAwesomeIcon icon={faPlusCircle} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InductionAssessment;
