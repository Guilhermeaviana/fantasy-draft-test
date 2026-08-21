import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Link,
    useParams,
} from 'react-router-dom';

import api from '../api/client';

import ResultBar from '../components/ResultBar';
import StatusBadge from '../components/StatusBadge';

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
    const [copied, setCopied] =
        useState(false);

    const loadPoll = useCallback(async () => {
        try {
            const data =
                await fetchPoll(pollId);

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

    const showResults = Boolean(
        poll
        && (
            poll.has_voted
            || effectiveStatus === 'closed'
        ),
    );

    const resultSummary = useMemo(() => {
        if (
            !poll
            || !showResults
            || poll.options.length === 0
        ) {
            return null;
        }

        const highestVotes = Math.max(
            ...poll.options.map(
                (option) => option.votes,
            ),
        );

        const leaders =
            poll.options.filter(
                (option) =>
                    option.votes
                    === highestVotes,
            );

        if (leaders.length > 1) {
            return {
                label: 'Empate',
                percentage:
                    leaders[0]?.percentage ?? 0,
            };
        }

        return {
            label: leaders[0].label,
            percentage:
                leaders[0].percentage,
        };
    }, [poll, showResults]);

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
            const response =
                await api.post(
                    `/api/polls/${poll.id}/votes`,
                    {
                        poll_option_id:
                            optionId,
                    },
                );

            setPoll(response.data);
        } catch (requestError) {
            const code =
                requestError.response
                    ?.data?.code;

            if (
                code === 'already_voted'
                || code === 'poll_closed'
            ) {
                await loadPoll();
            }

            setError(
                requestError.response
                    ?.data?.message
                ?? 'Não foi possível registrar seu voto.',
            );
        } finally {
            setVoting(false);
        }
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(
                window.location.href,
            );

            setCopied(true);

            window.setTimeout(() => {
                setCopied(false);
            }, 1600);
        } catch {
            setCopied(false);
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
                <div className={styles.loading}>
                    <div
                        className={
                            styles.loader
                        }
                    />

                    <span>
                        Carregando enquete...
                    </span>
                </div>
            </main>
        );
    }

    if (notFound) {
        return (
            <main className={styles.page}>
                <div className={styles.notFound}>
                    <span>404</span>

                    <h1>
                        Enquete não encontrada
                    </h1>

                    <p>
                        Esta votação não existe ou
                        não está mais disponível.
                    </p>

                    <Link to="/">
                        Voltar ao lobby
                    </Link>
                </div>
            </main>
        );
    }

    if (!poll) {
        return (
            <main className={styles.page}>
                <div className={styles.loading}>
                    <span>{error}</span>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <div className={styles.breadcrumb}>
                <Link to="/">
                    ← Lobby
                </Link>

                <span>/</span>

                <span>
                    Enquete #{poll.id}
                </span>
            </div>

            <section className={styles.shell}>
                <div className={styles.hero}>
                    <div className={styles.heroTop}>
                        <div
                            className={
                                styles.heroStatus
                            }
                        >
                            <StatusBadge
                                status={
                                    effectiveStatus
                                }
                            />

                            <span
                                className={
                                    styles.realtime
                                }
                            >
                                <span
                                    className={
                                        socketStatus
                                        === 'connected'
                                            ? styles.realtimeDot
                                            : styles.realtimeDotOffline
                                    }
                                />

                                {socketStatus
                                === 'connected'
                                    ? 'Atualização ao vivo'
                                    : socketStatus
                                        === 'reconnecting'
                                      ? 'Reconectando'
                                      : 'Conectando'}
                            </span>
                        </div>

                        <button
                            type="button"
                            className={
                                styles.share
                            }
                            onClick={copyLink}
                        >
                            {copied
                                ? 'Link copiado'
                                : 'Compartilhar'}
                        </button>
                    </div>

                    <span
                        className={
                            styles.pollEyebrow
                        }
                    >
                        FANTASYDRAFT COMMUNITY
                    </span>

                    <h1>{poll.question}</h1>

                    <p>
                        {showResults
                            ? effectiveStatus
                                === 'closed'
                                ? 'A votação foi encerrada. Confira o consenso final da comunidade.'
                                : 'Seu voto foi registrado. O resultado continua mudando em tempo real.'
                            : 'Escolha sua previsão. Os resultados serão liberados após o seu voto.'}
                    </p>

                    <div className={styles.metrics}>
                        <div>
                            <span>VOTOS</span>

                            <strong>
                                {poll.total_votes}
                            </strong>
                        </div>

                        <div>
                            <span>OPÇÕES</span>

                            <strong>
                                {
                                    poll.options
                                        .length
                                }
                            </strong>
                        </div>

                        <div>
                            <span>STATUS</span>

                            <strong>
                                {effectiveStatus
                                === 'open'
                                    ? 'Ao vivo'
                                    : 'Encerrada'}
                            </strong>
                        </div>

                        <div>
                            <span>
                                ENCERRAMENTO
                            </span>

                            <strong>
                                {effectiveStatus
                                === 'closed'
                                    ? 'Finalizada'
                                    : poll.closes_at
                                      ? countdown.label
                                      : 'Sem limite'}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className={styles.contentGrid}>
                    <section
                        className={
                            styles.mainContent
                        }
                    >
                        <div
                            className={
                                styles.sectionHeader
                            }
                        >
                            <div>
                                <span>
                                    {showResults
                                        ? 'CONSENSO DA COMUNIDADE'
                                        : 'FAÇA SUA ESCOLHA'}
                                </span>

                                <h2>
                                    {showResults
                                        ? effectiveStatus
                                            === 'closed'
                                            ? 'Resultado final'
                                            : 'Resultado ao vivo'
                                        : 'Qual é a sua previsão?'}
                                </h2>
                            </div>

                            {showResults && (
                                <span
                                    className={
                                        styles.totalVotes
                                    }
                                >
                                    {
                                        poll.total_votes
                                    }{' '}
                                    {poll.total_votes
                                    === 1
                                        ? 'voto'
                                        : 'votos'}
                                </span>
                            )}
                        </div>

                        {showResults ? (
                            <div
                                className={
                                    styles.results
                                }
                            >
                                {poll.options.map(
                                    (
                                        option,
                                        index,
                                    ) => (
                                        <ResultBar
                                            key={
                                                option.id
                                            }
                                            option={
                                                option
                                            }
                                            index={
                                                index
                                            }
                                            selected={
                                                poll.my_vote_option_id
                                                === option.id
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        ) : (
                            <div
                                className={
                                    styles.voteOptions
                                }
                            >
                                {poll.options.map(
                                    (
                                        option,
                                        index,
                                    ) => (
                                        <button
                                            key={
                                                option.id
                                            }
                                            type="button"
                                            className={
                                                styles.voteOption
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
                                            <span
                                                className={
                                                    styles.optionNumber
                                                }
                                            >
                                                {String(
                                                    index
                                                    + 1,
                                                ).padStart(
                                                    2,
                                                    '0',
                                                )}
                                            </span>

                                            <span
                                                className={
                                                    styles.optionName
                                                }
                                            >
                                                {
                                                    option.label
                                                }
                                            </span>

                                            <span
                                                className={
                                                    styles.optionAction
                                                }
                                            >
                                                {voting
                                                    ? 'Registrando...'
                                                    : 'Selecionar →'}
                                            </span>
                                        </button>
                                    ),
                                )}
                            </div>
                        )}

                        {error && (
                            <div
                                className={
                                    styles.error
                                }
                            >
                                {error}
                            </div>
                        )}
                    </section>

                    <aside className={styles.sidebar}>
                        <span
                            className={
                                styles.sidebarEyebrow
                            }
                        >
                            LIVE DATA
                        </span>

                        <h3>
                            Visão da votação
                        </h3>

                        {showResults
                            && resultSummary && (
                                <div
                                    className={
                                        styles.consensus
                                    }
                                >
                                    <span>
                                        LIDERANÇA
                                    </span>

                                    <strong>
                                        {
                                            resultSummary.label
                                        }
                                    </strong>

                                    {resultSummary.label
                                    !== 'Empate' && (
                                        <small>
                                            {
                                                resultSummary.percentage
                                            }
                                            % da
                                            comunidade
                                        </small>
                                    )}
                                </div>
                            )}

                        {!showResults && (
                            <div
                                className={
                                    styles.lockedResult
                                }
                            >
                                <div>◉</div>

                                <strong>
                                    Resultado
                                    protegido
                                </strong>

                                <span>
                                    Vote antes de
                                    visualizar a opinião
                                    da comunidade.
                                </span>
                            </div>
                        )}

                        <div
                            className={
                                styles.sidebarMetrics
                            }
                        >
                            <div>
                                <span>
                                    Conexão
                                </span>

                                <strong>
                                    {socketStatus
                                    === 'connected'
                                        ? 'Online'
                                        : 'Reconectando'}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Enquete
                                </span>

                                <strong>
                                    #{poll.id}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Atualização
                                </span>

                                <strong>
                                    WebSocket
                                </strong>
                            </div>
                        </div>

                        <button
                            type="button"
                            className={
                                styles.copyButton
                            }
                            onClick={copyLink}
                        >
                            {copied
                                ? '✓ Link copiado'
                                : 'Copiar link da enquete'}
                        </button>
                    </aside>
                </div>
            </section>
        </main>
    );
}