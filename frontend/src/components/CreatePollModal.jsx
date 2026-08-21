import { useState } from 'react';
import api from '../api/client';
import styles from './CreatePollModal.module.css';

export default function CreatePollModal({
    open,
    onClose,
    onCreated,
}) {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [duration, setDuration] = useState('15');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!open) {
        return null;
    }

    const updateOption = (index, value) => {
        setOptions((current) =>
            current.map((option, optionIndex) =>
                optionIndex === index ? value : option,
            ),
        );
    };

    const addOption = () => {
        if (options.length < 10) {
            setOptions((current) => [...current, '']);
        }
    };

    const removeOption = (index) => {
        if (options.length <= 2) {
            return;
        }

        setOptions((current) =>
            current.filter((_, optionIndex) => optionIndex !== index),
        );
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setSubmitting(true);
        setError('');

        try {
            const payload = {
                question: question.trim(),
                options: options.map((option) => option.trim()),
                duration_minutes:
                    duration === ''
                        ? null
                        : Number(duration),
            };

            const response = await api.post('/api/polls', payload);

            onCreated(response.data);

            setQuestion('');
            setOptions(['', '']);
            setDuration('15');
            onClose();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message
                    ?? 'Não foi possível criar a enquete.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div
                className={styles.modal}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className={styles.heading}>
                    <div>
                        <span>NOVA ENQUETE</span>
                        <h2>Crie uma votação</h2>
                    </div>

                    <button
                        type="button"
                        className={styles.close}
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <label className={styles.field}>
                        <span>Pergunta</span>

                        <input
                            value={question}
                            onChange={(event) =>
                                setQuestion(event.target.value)
                            }
                            maxLength={255}
                            placeholder="Quem vence o confronto de hoje?"
                            required
                        />
                    </label>

                    <div className={styles.optionsHeader}>
                        <span>Opções</span>
                        <small>2 a 10 alternativas</small>
                    </div>

                    <div className={styles.options}>
                        {options.map((option, index) => (
                            <div
                                className={styles.optionRow}
                                key={index}
                            >
                                <span className={styles.number}>
                                    {index + 1}
                                </span>

                                <input
                                    value={option}
                                    maxLength={120}
                                    required
                                    placeholder={`Opção ${index + 1}`}
                                    onChange={(event) =>
                                        updateOption(
                                            index,
                                            event.target.value,
                                        )
                                    }
                                />

                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeOption(index)
                                        }
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {options.length < 10 && (
                        <button
                            className={styles.addOption}
                            type="button"
                            onClick={addOption}
                        >
                            + Adicionar opção
                        </button>
                    )}

                    <label className={styles.field}>
                        <span>Duração</span>

                        <select
                            value={duration}
                            onChange={(event) =>
                                setDuration(event.target.value)
                            }
                        >
                            <option value="5">5 minutos</option>
                            <option value="15">15 minutos</option>
                            <option value="30">30 minutos</option>
                            <option value="60">1 hora</option>
                            <option value="">Sem limite</option>
                        </select>
                    </label>

                    {error && (
                        <div className={styles.error}>{error}</div>
                    )}

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.cancel}
                            onClick={onClose}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className={styles.submit}
                            disabled={submitting}
                        >
                            {submitting
                                ? 'Criando...'
                                : 'Criar enquete'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}