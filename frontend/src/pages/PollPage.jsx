import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    Link,
    useParams,
} from 'react-router-dom';

import api from '../api/client';
import { useCountdown } from '../hooks/useCountdown';
import { usePollSocket } from '../hooks/usePollSocket';

import styles from './PollPage.module.css';

async function fetchPoll(pollId) {
    const response = await api.get(
        `/api/polls/${pollId}`,
    );

    return response.data;
}

export default function PollPage() {
    const { pollId } = useParams();

    const [poll, setPoll] = useState(null);
    const [loading, setLoading] =
        useState(true);
    const [voting, setVoting] =
        useState(false);
    const [error, setError] = useState('');
    const [notFound, setNotFound] =
        useState(false);

    const loadPoll = useCallback(async () => {
        try {
            const data = await fetchPoll(
                pollId,
            );

            setPoll(data);
            setError('');
            setNotFound(false);
        } catch (requestError) {
            setPoll(null);

            if (
                requestError.response?.status
                === 404
            ) {
                setNotFound(true);
                setError('');
                return;
            }

            setNotFound(false);
            setError(
                'Não foi possível carregar esta enquete.',
            );
        }
    }, [pollId]);

    useEffect(() => {
        let active = true;

        fetchPoll(pollId)
            .then((data) => {
                if (!active) {
                    return;
                }

                setPoll(data);
                setError('');
                setNotFound(false);
            })
            .catch((requestError) => {
                if (!active) {
                    return;
                }

                setPoll(null);

                if (
                    requestError.response?.status
                    === 404
                ) {
                    setNotFound(true);
                    setError('');
                    return;
                }

                setNotFound(false);
                setError(
                    'Não foi possível carregar esta enquete.',
                );
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [pollId]);

    const handleRealtimeResults =
        useCallback((results) => {
            setPoll((current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    status: results.status,
                    closes_at:
                        results.closes_at,
                    total_votes:
                        results.total_votes,
                    options:
                        current.options.map(
                            (option) => {
                                const updated =
                                    results.options.find(
                                        (
                                            resultOption,
                                        ) =>
                                            resultOption.id
                                            === option.id,
                                    );

                                return updated
                                    ? {
                                        ...option,
                                        votes:
                                            updated.votes,
                                        percentage:
                                            updated.percentage,
                                    }
                                    : option;
                            },
                        ),
                };
            });
        }, []);

    const socketStatus = usePollSocket(
        Number(pollId),
        handleRealtimeResults,
        loadPoll,
    );

    const countdown = useCountdown(
        poll?.closes_at,
        poll?.status,
        loadPoll,
    );

    const effectiveStatus =
        poll?.status === 'closed'
        || countdown.isExpired
            ? 'closed'
            : 'open';

    const vote = async (optionId) => {
        if (
            !poll
            || poll.has_voted
            || effectiveStatus === 'closed'
            || voting
        ) {
            return;
        }

        setVoting(true);
        setError('');

        try {
            const response = await api.post(
                `/api/polls/${poll.id}/votes`,
                {
                    poll_option_id: optionId,
                },
            );

            setPoll(response.data);
        } catch (requestError) {
            const code =
                requestError.response?.data?.code;

            if (
                code === 'already_voted'
                || code === 'poll_closed'
            ) {
                await loadPoll();
            }

            setError(
                requestError.response?.data
                    ?.message
                ?? 'Não foi possível registrar seu voto.',
            );
        } finally {
            setVoting(false);
        }
    };

    const pollMatchesRoute =
        poll
        && Number(poll.id)
            === Number(pollId);

    if (
        loading
        || (poll && !pollMatchesRoute)
    ) {
        return (
            <main className={styles.page}>
                <div className={styles.state}>
                    Carregando enquete...
                </div>
            </main>
        );
    }

    if (notFound) {
        return (
            <main className={styles.page}>
                <div
                    className={
                        styles.notFound
                    }
                >
                    <span>404</span>

                    <h1>
                        Enquete não encontrada
                    </h1>

                    <p>
                        Esta enquete não existe ou
                        não está mais disponível.
                    </p>

                    <Link to="/">
                        Voltar ao mural
                    </Link>
                </div>
            </main>
        );
    }

    if (!poll) {
        return (
            <main className={styles.page}>
                <div className={styles.state}>
                    {error}
                </div>
            </main>
        );
    }

    const showResults =
        poll.has_voted
        || effectiveStatus === 'closed';

    return (
        <main className={styles.page}>
            <Link
                to="/"
                className={styles.back}
            >
                ← Voltar ao mural
            </Link>

            <section className={styles.poll}>
                <div className={styles.top}>
                    <div
                        className={
                            styles.statuses
                        }
                    >
                        <span
                            className={
                                effectiveStatus
                                === 'open'
                                    ? styles.live
                                    : styles.closed
                            }
                        >
                            {effectiveStatus
                            === 'open'
                                ? '● AO VIVO'
                                : 'ENCERRADA'}
                        </span>

                        <span
                            className={
                                styles.socket
                            }
                        >
                            {socketStatus
                            === 'connected'
                                ? 'Tempo real conectado'
                                : socketStatus
                                    === 'reconnecting'
                                  ? 'Reconectando...'
                                  : 'Conectando...'}
                        </span>
                    </div>

                    <div
                        className={styles.meta}
                    >
                        <span
                            className={
                                styles.timer
                            }
                        >
                            {effectiveStatus
                            === 'closed'
                                ? 'Encerrada'
                                : poll.closes_at
                                  ? `Encerra em ${countdown.label}`
                                  : countdown.label}
                        </span>

                        <span
                            className={
                                styles.voteCount
                            }
                        >
                            {poll.total_votes}{' '}
                            {poll.total_votes
                            === 1
                                ? 'voto'
                                : 'votos'}
                        </span>
                    </div>
                </div>

                <h1>{poll.question}</h1>

                {!showResults && (
                    <p
                        className={
                            styles.instruction
                        }
                    >
                        Escolha uma opção. Os
                        resultados aparecem depois
                        do seu voto.
                    </p>
                )}

                {showResults && (
                    <p
                        className={
                            styles.instruction
                        }
                    >
                        {effectiveStatus
                        === 'closed'
                            ? 'Resultado final da enquete.'
                            : 'Seu voto foi registrado. Acompanhe os resultados ao vivo.'}
                    </p>
                )}

                <div className={styles.options}>
                    {poll.options.map(
                        (option) => {
                            const selected =
                                poll.my_vote_option_id
                                === option.id;

                            if (showResults) {
                                return (
                                    <div
                                        className={`${styles.result} ${
                                            selected
                                                ? styles.selected
                                                : ''
                                        }`}
                                        key={
                                            option.id
                                        }
                                    >
                                        <div
                                            className={
                                                styles.resultFill
                                            }
                                            style={{
                                                width: `${option.percentage}%`,
                                            }}
                                        />

                                        <div
                                            className={
                                                styles.resultContent
                                            }
                                        >
                                            <span>
                                                {
                                                    option.label
                                                }

                                                {selected && (
                                                    <small>
                                                        Seu voto
                                                    </small>
                                                )}
                                            </span>

                                            <strong>
                                                {
                                                    option.percentage
                                                }
                                                %
                                            </strong>
                                        </div>

                                        <div
                                            className={
                                                styles.optionVotes
                                            }
                                        >
                                            {
                                                option.votes
                                            }{' '}
                                            {option.votes
                                            === 1
                                                ? 'voto'
                                                : 'votos'}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <button
                                    className={
                                        styles.option
                                    }
                                    key={
                                        option.id
                                    }
                                    disabled={
                                        voting
                                    }
                                    onClick={() =>
                                        vote(
                                            option.id,
                                        )
                                    }
                                >
                                    <span>
                                        {
                                            option.label
                                        }
                                    </span>

                                    <strong>
                                        {voting
                                            ? 'Aguarde...'
                                            : 'Votar →'}
                                    </strong>
                                </button>
                            );
                        },
                    )}
                </div>

                {error && (
                    <div
                        className={
                            styles.error
                        }
                    >
                        {error}
                    </div>
                )}

                <div className={styles.footer}>
                    <span>
                        Enquete #{poll.id}
                    </span>

                    <span>
                        Resultados atualizados ao
                        vivo
                    </span>
                </div>
            </section>
        </main>
    );
}