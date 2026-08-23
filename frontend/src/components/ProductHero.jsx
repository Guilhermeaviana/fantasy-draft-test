import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import api from '../api/client';

import styles from './ProductHero.module.css';

function getLocalDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(
        today.getMonth() + 1,
    ).padStart(2, '0');
    const day = String(
        today.getDate(),
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getInitials(name = '') {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function formatStartsAt(value) {
    if (!value) {
        return 'Horário indefinido';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Horário indefinido';
    }

    return new Intl.DateTimeFormat(
        'pt-BR',
        {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        },
    )
        .format(date)
        .replace('.', '')
        .toUpperCase();
}

function normalizeStatus(status) {
    if (status === 'live') {
        return 'AO VIVO';
    }

    if (status === 'closed'
        || status === 'finished') {
        return 'ENCERRADO';
    }

    return 'PRÓXIMO';
}

function TeamMark({
    name,
    logo,
}) {
    const [failed, setFailed] =
        useState(false);

    if (logo && !failed) {
        return (
            <span className={styles.teamMark}>
                <img
                    src={logo}
                    alt=""
                    onError={() =>
                        setFailed(true)
                    }
                />
            </span>
        );
    }

    return (
        <span className={styles.teamMark}>
            {getInitials(name)}
        </span>
    );
}

async function fetchSportsEvents() {
    const response = await api.get(
        '/api/sports-events',
        {
            params: {
                date: getLocalDate(),
                days: 7,
                eligible_for_poll: 1,
            },
        },
    );

    return Array.isArray(response.data)
        ? response.data
        : [];
}

function sortEvents(events) {
    const live = [];
    const scheduled = [];
    const closed = [];

    events.forEach((event) => {
        if (event.status === 'live') {
            live.push(event);
            return;
        }

        if (
            event.status === 'finished'
            || event.status === 'closed'
            || event.status === 'postponed'
        ) {
            closed.push(event);
            return;
        }

        scheduled.push(event);
    });

    const byDate = (a, b) =>
        new Date(a.starts_at).getTime()
        - new Date(b.starts_at).getTime();

    live.sort(byDate);
    scheduled.sort(byDate);
    closed.sort(byDate);

    return [
        ...live,
        ...scheduled,
        ...closed,
    ];
}

export default function ProductHero({
    onCreatePoll,
    onQuickCreate,
}) {
    const [events, setEvents] = useState(
        [],
    );
    const [currentIndex, setCurrentIndex] =
        useState(0);

    useEffect(() => {
        let active = true;

        fetchSportsEvents()
            .then((data) => {
                if (!active) {
                    return;
                }

                setEvents(
                    sortEvents(data).slice(
                        0,
                        6,
                    ),
                );
            })
            .catch(() => {
                if (!active) {
                    return;
                }

                setEvents([]);
            });

        return () => {
            active = false;
        };
    }, []);

    const currentEvent = useMemo(() => {
        if (events.length === 0) {
            return null;
        }

        return (
            events[
                currentIndex
                % events.length
            ] ?? null
        );
    }, [events, currentIndex]);

    useEffect(() => {
        if (events.length <= 1) {
            return undefined;
        }

        const interval =
            window.setInterval(() => {
                setCurrentIndex(
                    (value) =>
                        (value + 1)
                        % events.length,
                );
            }, 3200);

        return () => {
            window.clearInterval(interval);
        };
    }, [events.length]);

    return (
        <section className={styles.hero}>
            <div className={styles.content}>
                <div className={styles.eyebrow}>
                    <span className={styles.liveDot} />
                    FANTASYDRAFT LIVE
                </div>

                <h1>
                    Escolha seu lado.
                    <br />
                    Vote em tempo real.
                </h1>

                <p>
                    Acompanhe partidas
                    reais, transforme
                    confrontos em
                    enquetes e veja as
                    escolhas da comunidade
                    acontecerem em tempo
                    real.
                </p>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={
                            styles.createButton
                        }
                        onClick={onCreatePoll}
                    >
                        <span>+</span>
                        Criar enquete
                    </button>

                    <span
                        className={
                            styles.realtimeNote
                        }
                    >
                        <span
                            className={
                                styles.realtimeDot
                            }
                        />
                        Atualizações via
                        WebSocket
                    </span>
                </div>
            </div>

            <div
                className={
                    styles.previewWrapper
                }
            >
                <div className={styles.glow} />

                <div className={styles.preview}>
                    <div
                        className={
                            styles.previewHeader
                        }
                    >
                        <div>
                            <span>
                                {currentEvent
                                    ?.league
                                    ?? 'LIVE POLL'}
                            </span>

                            <strong>
                                {currentEvent
                                    ? formatStartsAt(
                                          currentEvent.starts_at,
                                      )
                                    : 'Enquete esportiva'}
                            </strong>
                        </div>

                        <button
                            type="button"
                            className={
                                styles.realtimeBadge
                            }
                            onClick={() => {
                                if (
                                    currentEvent
                                ) {
                                    onQuickCreate(
                                        currentEvent,
                                    );
                                }
                            }}
                        >
                            <span
                                className={
                                    styles.realtimeDot
                                }
                            />
                            {normalizeStatus(
                                currentEvent?.status,
                            )}
                        </button>
                    </div>

                    <div className={styles.matchup}>
                        <div className={styles.team}>
                            <TeamMark
                                name={
                                    currentEvent
                                        ?.home_team
                                        ?.name
                                    ?? 'Mandante'
                                }
                                logo={
                                    currentEvent
                                        ?.home_team
                                        ?.logo
                                }
                            />

                            <div>
                                <small>
                                    MANDANTE
                                </small>

                                <strong>
                                    {currentEvent
                                        ?.home_team
                                        ?.name
                                        ?? 'Time da casa'}
                                </strong>
                            </div>
                        </div>

                        <div className={styles.versus}>
                            VS
                        </div>

                        <div
                            className={`${styles.team} ${styles.awayTeam}`}
                        >
                            <TeamMark
                                name={
                                    currentEvent
                                        ?.away_team
                                        ?.name
                                    ?? 'Visitante'
                                }
                                logo={
                                    currentEvent
                                        ?.away_team
                                        ?.logo
                                }
                            />

                            <div>
                                <small>
                                    VISITANTE
                                </small>

                                <strong>
                                    {currentEvent
                                        ?.away_team
                                        ?.name
                                        ?? 'Time visitante'}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div className={styles.question}>
                        <span>
                            QUEM VENCE?
                        </span>

                        <strong>
                            {currentEvent
                                ? `${currentEvent.home_team.name} × ${currentEvent.away_team.name}`
                                : 'Escolha seu favorito'}
                        </strong>
                    </div>

                    <div className={styles.options}>
                        <button
                            type="button"
                            className={`${styles.option} ${styles.optionFirst}`}
                            onClick={() => {
                                if (
                                    currentEvent
                                ) {
                                    onQuickCreate(
                                        currentEvent,
                                    );
                                }
                            }}
                        >
                            <span
                                className={
                                    styles.optionIndex
                                }
                            >
                                01
                            </span>

                            <strong>
                                {currentEvent
                                    ?.home_team
                                    ?.name
                                    ?? 'Mandante'}
                            </strong>

                            <span
                                className={
                                    styles.choice
                                }
                            />
                        </button>

                        <button
                            type="button"
                            className={`${styles.option} ${styles.optionSecond}`}
                            onClick={() => {
                                if (
                                    currentEvent
                                ) {
                                    onQuickCreate(
                                        currentEvent,
                                    );
                                }
                            }}
                        >
                            <span
                                className={
                                    styles.optionIndex
                                }
                            >
                                02
                            </span>

                            <strong>
                                {currentEvent
                                    ?.away_team
                                    ?.name
                                    ?? 'Visitante'}
                            </strong>

                            <span
                                className={
                                    styles.choice
                                }
                            />
                        </button>
                    </div>

                    <div className={styles.sync}>
                        <span
                            className={
                                styles.syncPulse
                            }
                        />
                        Evento real
                        sincronizado

                        <strong>
                            {events.length > 0
                                ? `${currentIndex + 1}/${events.length}`
                                : 'LIVE'}
                        </strong>
                    </div>
                </div>
            </div>
        </section>
    );
}