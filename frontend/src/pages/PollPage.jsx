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

function getInitials(name) {
    return String(name ?? '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function formatEventDate(value) {
    if (!value) {
        return 'Horário não informado';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Horário não informado';
    }

    return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
        .format(date)
        .replace('.', '')
        .toUpperCase();
}

function formatEventTime(value) {
    if (!value) {
        return '--:--';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '--:--';
    }

    return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function getEventStatusLabel(status) {
    const labels = {
        scheduled: 'AGENDADO',
        live: 'AO VIVO',
        finished: 'FINALIZADO',
        postponed: 'ADIADO',
        cancelled: 'CANCELADO',
        canceled: 'CANCELADO',
    };

    return labels[status] ?? String(status ?? 'AGENDADO').toUpperCase();
}

function getEventStatusClass(status) {
    if (status === 'live') {
        return styles.eventStatusLive;
    }

    if (status === 'finished') {
        return styles.eventStatusFinished;
    }

    if (
        status === 'postponed'
        || status === 'cancelled'
        || status === 'canceled'
    ) {
        return styles.eventStatusAlert;
    }

    return styles.eventStatusScheduled;
}

function TeamLogo({ name, logo, compact = false }) {
    const [failed, setFailed] = useState(false);

    const className = compact
        ? styles.optionTeamLogo
        : styles.teamLogo;

    const fallbackClassName = compact
        ? styles.optionTeamFallback
        : styles.teamFallback;

    if (logo && !failed) {
        return (
            <img
                src={logo}
                alt=""
                className={className}
                onError={() => setFailed(true)}
            />
        );
    }

    return (
        <span className={fallbackClassName}>
            {getInitials(name) || '?'}
        </span>
    );
}

function getTeamForOption(sportsEvent, label) {
    if (!sportsEvent) {
        return null;
    }

    const normalizedLabel = String(label)
        .trim()
        .toLocaleLowerCase('pt-BR');

    const teams = [
        sportsEvent.home_team,
        sportsEvent.away_team,
    ];

    return teams.find((team) =>
        String(team?.name ?? '')
            .trim()
            .toLocaleLowerCase('pt-BR')
        === normalizedLabel,
    ) ?? null;
}

function SportsEventHero({ sportsEvent }) {
    const home = sportsEvent.home_team;
    const away = sportsEvent.away_team;

    const hasScore =
        home?.score !== null
        && home?.score !== undefined
        && away?.score !== null
        && away?.score !== undefined;

    return (
        <div className={styles.sportsHero}>
            <div className={styles.sportsHeroMeta}>
                <div>
                    <span className={styles.sportLabel}>
                        {sportsEvent.sport}
                    </span>

                    <strong>
                        {sportsEvent.league
                            ?? 'Evento esportivo'}
                    </strong>
                </div>

                <div className={styles.eventMetaRight}>
                    <span>{formatEventDate(sportsEvent.starts_at)}</span>

                    <span
                        className={`${styles.eventStatus} ${getEventStatusClass(
                            sportsEvent.status,
                        )}`}
                    >
                        {getEventStatusLabel(sportsEvent.status)}
                    </span>
                </div>
            </div>

            <div className={styles.matchupHero}>
                <div className={styles.heroTeam}>
                    <TeamLogo
                        name={home?.name}
                        logo={home?.logo}
                    />

                    <strong>{home?.name}</strong>
                    <span>Mandante</span>
                </div>

                <div className={styles.matchCenter}>
                    {hasScore ? (
                        <div className={styles.heroScore}>
                            <strong>{home.score}</strong>
                            <span>:</span>
                            <strong>{away.score}</strong>
                        </div>
                    ) : (
                        <>
                            <span className={styles.matchTime}>
                                {formatEventTime(
                                    sportsEvent.starts_at,
                                )}
                            </span>
                            <span className={styles.versus}>VS</span>
                        </>
                    )}

                    {sportsEvent.venue && (
                        <small>{sportsEvent.venue}</small>
                    )}
                </div>

                <div className={`${styles.heroTeam} ${styles.heroTeamAway}`}>
                    <TeamLogo
                        name={away?.name}
                        logo={away?.logo}
                    />

                    <strong>{away?.name}</strong>
                    <span>Visitante</span>
                </div>
            </div>
        </div>
    );
}

export default function PollPage() {
    const { pollId } = useParams();

    const [poll, setPoll] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [error, setError] = useState('');
    const [notFound, setNotFound] = useState(false);
    const [copied, setCopied] = useState(false);

    const loadPoll = useCallback(async () => {
        try {
            const data = await fetchPoll(pollId);

            setPoll(data);
            setError('');
            setNotFound(false);
        } catch (requestError) {
            setPoll(null);

            if (requestError.response?.status === 404) {
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

                if (requestError.response?.status === 404) {
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

    const handleRealtimeResults = useCallback((results) => {
        setPoll((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                status: results.status,
                closes_at: results.closes_at,
                total_votes: results.total_votes,
                options: current.options.map((option) => {
                    const updated = results.options.find(
                        (resultOption) =>
                            resultOption.id === option.id,
                    );

                    return updated
                        ? {
                            ...option,
                            votes: updated.votes,
                            percentage: updated.percentage,
                        }
                        : option;
                }),
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
            ...poll.options.map((option) => option.votes),
        );

        const leaders = poll.options.filter(
            (option) => option.votes === highestVotes,
        );

        if (leaders.length > 1) {
            return {
                label: 'Empate',
                percentage: leaders[0]?.percentage ?? 0,
            };
        }

        return {
            label: leaders[0].label,
            percentage: leaders[0].percentage,
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
            const response = await api.post(
                `/api/polls/${poll.id}/votes`,
                {
                    poll_option_id: optionId,
                },
            );

            setPoll(response.data);
        } catch (requestError) {
            const code = requestError.response?.data?.code;

            if (
                code === 'already_voted'
                || code === 'poll_closed'
            ) {
                await loadPoll();
            }

            setError(
                requestError.response?.data?.message
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
        && Number(poll.id) === Number(pollId);

    if (
        loading
        || (poll && !pollMatchesRoute)
    ) {
        return (
            <main className={styles.page}>
                <div className={styles.loading}>
                    <div className={styles.loader} />
                    <span>Carregando enquete...</span>
                </div>
            </main>
        );
    }

    if (notFound) {
        return (
            <main className={styles.page}>
                <div className={styles.notFound}>
                    <span>404</span>
                    <h1>Enquete não encontrada</h1>
                    <p>
                        Esta votação não existe ou não está
                        mais disponível.
                    </p>
                    <Link to="/">Voltar ao lobby</Link>
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

    const sportsEvent = poll.sports_event;

    return (
        <main className={styles.page}>
            <div className={styles.breadcrumb}>
                <Link to="/">← Lobby</Link>
                <span>/</span>
                <span>Enquete #{poll.id}</span>
            </div>

            <section
                className={`${styles.shell} ${
                    sportsEvent ? styles.sportsShell : ''
                }`}
            >
                <div className={styles.hero}>
                    <div className={styles.heroTop}>
                        <div className={styles.heroStatus}>
                            <StatusBadge
                                status={effectiveStatus}
                            />

                            <span className={styles.realtime}>
                                <span
                                    className={
                                        socketStatus === 'connected'
                                            ? styles.realtimeDot
                                            : styles.realtimeDotOffline
                                    }
                                />

                                {socketStatus === 'connected'
                                    ? 'Sincronização em tempo real'
                                    : socketStatus === 'reconnecting'
                                        ? 'Reconectando'
                                        : 'Conectando'}
                            </span>
                        </div>

                        <button
                            type="button"
                            className={styles.share}
                            onClick={copyLink}
                        >
                            {copied
                                ? 'Link copiado'
                                : 'Compartilhar'}
                        </button>
                    </div>

                    {sportsEvent && (
                        <SportsEventHero
                            sportsEvent={sportsEvent}
                        />
                    )}

                    <span className={styles.pollEyebrow}>
                        {sportsEvent
                            ? 'ENQUETE DA PARTIDA'
                            : 'FANTASYDRAFT COMMUNITY'}
                    </span>

                    <h1
                        className={
                            sportsEvent
                                ? styles.sportsPollQuestion
                                : undefined
                        }
                    >
                        {poll.question}
                    </h1>

                    <p>
                        {showResults
                            ? effectiveStatus === 'closed'
                                ? 'A votação foi encerrada. Confira o consenso final da comunidade.'
                                : 'Seu voto foi registrado. O consenso continua sendo atualizado em tempo real.'
                            : 'Escolha sua previsão. Os resultados serão liberados após o seu voto.'}
                    </p>

                    <div className={styles.metrics}>
                        <div>
                            <span>VOTOS</span>
                            <strong>{poll.total_votes}</strong>
                        </div>

                        <div>
                            <span>OPÇÕES</span>
                            <strong>{poll.options.length}</strong>
                        </div>

                        <div>
                            <span>STATUS DA ENQUETE</span>
                            <strong>
                                {effectiveStatus === 'open'
                                    ? 'Aberta'
                                    : 'Encerrada'}
                            </strong>
                        </div>

                        <div>
                            <span>ENCERRAMENTO</span>
                            <strong>
                                {effectiveStatus === 'closed'
                                    ? 'Finalizada'
                                    : poll.closes_at
                                        ? countdown.label
                                        : 'Sem limite'}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className={styles.contentGrid}>
                    <section className={styles.mainContent}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <span>
                                    {showResults
                                        ? 'CONSENSO DA COMUNIDADE'
                                        : 'FAÇA SUA ESCOLHA'}
                                </span>

                                <h2>
                                    {showResults
                                        ? effectiveStatus === 'closed'
                                            ? 'Resultado final'
                                            : 'Resultado em tempo real'
                                        : 'Qual é a sua previsão?'}
                                </h2>
                            </div>

                            {showResults && (
                                <span className={styles.totalVotes}>
                                    {poll.total_votes}{' '}
                                    {poll.total_votes === 1
                                        ? 'voto'
                                        : 'votos'}
                                </span>
                            )}
                        </div>

                        {showResults ? (
                            <div className={styles.results}>
                                {poll.options.map(
                                    (option, index) => (
                                        <ResultBar
                                            key={option.id}
                                            option={option}
                                            index={index}
                                            selected={
                                                poll.my_vote_option_id
                                                === option.id
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        ) : (
                            <div className={styles.voteOptions}>
                                {poll.options.map(
                                    (option, index) => {
                                        const optionTeam =
                                            getTeamForOption(
                                                sportsEvent,
                                                option.label,
                                            );

                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                className={styles.voteOption}
                                                disabled={voting}
                                                onClick={() =>
                                                    vote(option.id)
                                                }
                                            >
                                                <span
                                                    className={
                                                        styles.optionIdentity
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.optionNumber
                                                        }
                                                    >
                                                        {String(
                                                            index + 1,
                                                        ).padStart(
                                                            2,
                                                            '0',
                                                        )}
                                                    </span>

                                                    {optionTeam && (
                                                        <TeamLogo
                                                            name={
                                                                optionTeam.name
                                                            }
                                                            logo={
                                                                optionTeam.logo
                                                            }
                                                            compact
                                                        />
                                                    )}

                                                    <span
                                                        className={
                                                            styles.optionName
                                                        }
                                                    >
                                                        {option.label}
                                                    </span>
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
                                        );
                                    },
                                )}
                            </div>
                        )}

                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}
                    </section>

                    <aside className={styles.sidebar}>
                        <span className={styles.sidebarEyebrow}>
                            TEMPO REAL
                        </span>

                        <h3>Visão da votação</h3>

                        {sportsEvent && (
                            <div className={styles.sidebarEvent}>
                                <span>EVENTO</span>
                                <strong>
                                    {sportsEvent.home_team?.name}
                                    {' × '}
                                    {sportsEvent.away_team?.name}
                                </strong>
                                <small>
                                    {sportsEvent.league}
                                    {' · '}
                                    {getEventStatusLabel(
                                        sportsEvent.status,
                                    )}
                                </small>
                            </div>
                        )}

                        {showResults && resultSummary && (
                            <div className={styles.consensus}>
                                <span>LIDERANÇA</span>
                                <strong>
                                    {resultSummary.label}
                                </strong>

                                {resultSummary.label !== 'Empate' && (
                                    <small>
                                        {resultSummary.percentage}% da
                                        comunidade
                                    </small>
                                )}
                            </div>
                        )}

                        {!showResults && (
                            <div className={styles.lockedResult}>
                                <div>◉</div>
                                <strong>Resultado protegido</strong>
                                <span>
                                    Vote antes de visualizar a opinião
                                    da comunidade.
                                </span>
                            </div>
                        )}

                        <div className={styles.sidebarMetrics}>
                            <div>
                                <span>Conexão</span>
                                <strong>
                                    {socketStatus === 'connected'
                                        ? 'Online'
                                        : 'Reconectando'}
                                </strong>
                            </div>

                            <div>
                                <span>Enquete</span>
                                <strong>#{poll.id}</strong>
                            </div>

                            <div>
                                <span>Sincronização</span>
                                <strong>Tempo real</strong>
                            </div>
                        </div>

                        <button
                            type="button"
                            className={styles.copyButton}
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