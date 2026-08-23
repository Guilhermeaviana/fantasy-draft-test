import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import api from '../api/client';

import styles from './LiveSportsSection.module.css';

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

function TeamLogo({
    name,
    logo,
}) {
    const [failed, setFailed] =
        useState(false);

    if (logo && !failed) {
        return (
            <span className={styles.logo}>
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
        <span className={styles.logo}>
            {getInitials(name)}
        </span>
    );
}

function formatWhen(value) {
    if (!value) {
        return 'Sem horário';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Sem horário';
    }

    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(
        tomorrow.getDate() + 1,
    );

    const isSameDay = (
        first,
        second,
    ) =>
        first.getFullYear()
            === second.getFullYear()
        && first.getMonth()
            === second.getMonth()
        && first.getDate()
            === second.getDate();

    const time = new Intl.DateTimeFormat(
        'pt-BR',
        {
            hour: '2-digit',
            minute: '2-digit',
        },
    ).format(date);

    if (isSameDay(date, now)) {
        return `Hoje · ${time}`;
    }

    if (isSameDay(date, tomorrow)) {
        return `Amanhã · ${time}`;
    }

    const day = new Intl.DateTimeFormat(
        'pt-BR',
        {
            day: '2-digit',
            month: '2-digit',
        },
    ).format(date);

    return `${day} · ${time}`;
}

function getStatusText(status) {
    if (status === 'live') {
        return 'AO VIVO';
    }

    if (
        status === 'finished'
        || status === 'closed'
    ) {
        return 'ENCERRADO';
    }

    return 'AGENDADO';
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
    const priority = {
        live: 0,
        scheduled: 1,
        open: 1,
        postponed: 2,
        finished: 3,
        closed: 3,
    };

    return [...events].sort(
        (a, b) => {
            const statusDiff =
                (priority[a.status] ?? 4)
                - (priority[b.status] ?? 4);

            if (statusDiff !== 0) {
                return statusDiff;
            }

            return (
                new Date(
                    a.starts_at,
                ).getTime()
                - new Date(
                    b.starts_at,
                ).getTime()
            );
        },
    );
}

export default function LiveSportsSection({
    onCreatePoll,
}) {
    const [events, setEvents] = useState(
        [],
    );
    const [loading, setLoading] =
        useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        fetchSportsEvents()
            .then((data) => {
                if (!active) {
                    return;
                }

                setEvents(
                    sortEvents(data),
                );
                setError('');
            })
            .catch(() => {
                if (!active) {
                    return;
                }

                setEvents([]);
                setError(
                    'Não foi possível carregar as partidas.',
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
    }, []);

    const visibleEvents = useMemo(
        () => events.slice(0, 6),
        [events],
    );

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <div
                    className={
                        styles.titleBlock
                    }
                >
                    <span
                        className={
                            styles.eyebrow
                        }
                    >
                        AGENDA ESPORTIVA
                    </span>

                    <h2>Partidas</h2>

                    <p>
                        Acompanhe os
                        confrontos e
                        transforme qualquer
                        partida em uma
                        votação da
                        comunidade.
                    </p>
                </div>

                <div
                    className={
                        styles.titleMeta
                    }
                >
                    <strong>
                        {events.length}{' '}
                        eventos
                        disponíveis
                    </strong>

                    <span>
                        próximos 7 dias
                    </span>
                </div>
            </div>

            {loading && (
                <div className={styles.state}>
                    <div
                        className={
                            styles.loader
                        }
                    />
                    <strong>
                        Carregando
                        partidas
                    </strong>
                </div>
            )}

            {!loading && error && (
                <div className={styles.state}>
                    <strong>
                        Algo deu errado
                    </strong>

                    <span>{error}</span>
                </div>
            )}

            {!loading
                && !error
                && visibleEvents.length
                    === 0 && (
                    <div className={styles.state}>
                        <strong>
                            Nenhuma partida
                            encontrada
                        </strong>

                        <span>
                            Não
                            encontramos
                            eventos
                            disponíveis no
                            momento.
                        </span>
                    </div>
                )}

            {!error
                && visibleEvents.length >
                    0 && (
                    <div className={styles.grid}>
                        {visibleEvents.map(
                            (event) => (
                                <article
                                    key={
                                        event.id
                                    }
                                    className={
                                        styles.card
                                    }
                                >
                                    <div
                                        className={
                                            styles.cardHeader
                                        }
                                    >
                                        <span
                                            className={
                                                styles.league
                                            }
                                        >
                                            {
                                                event.league
                                            }
                                        </span>

                                        <span
                                            className={`${styles.badge} ${
                                                event.status
                                                === 'live'
                                                    ? styles.badgeLive
                                                    : styles.badgeScheduled
                                            }`}
                                        >
                                            {getStatusText(
                                                event.status,
                                            )}
                                        </span>
                                    </div>

                                    <div
                                        className={
                                            styles.match
                                        }
                                    >
                                        <div
                                            className={
                                                styles.team
                                            }
                                        >
                                            <TeamLogo
                                                name={
                                                    event
                                                        .home_team
                                                        .name
                                                }
                                                logo={
                                                    event
                                                        .home_team
                                                        .logo
                                                }
                                            />

                                            <div
                                                className={
                                                    styles.teamInfo
                                                }
                                            >
                                                <strong>
                                                    {
                                                        event
                                                            .home_team
                                                            .name
                                                    }
                                                </strong>
                                            </div>
                                        </div>

                                        <div
                                            className={
                                                styles.versus
                                            }
                                        >
                                            VS
                                        </div>

                                        <div
                                            className={`${styles.team} ${styles.teamAway}`}
                                        >
                                            <TeamLogo
                                                name={
                                                    event
                                                        .away_team
                                                        .name
                                                }
                                                logo={
                                                    event
                                                        .away_team
                                                        .logo
                                                }
                                            />

                                            <div
                                                className={
                                                    styles.teamInfo
                                                }
                                            >
                                                <strong>
                                                    {
                                                        event
                                                            .away_team
                                                            .name
                                                    }
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className={
                                            styles.footer
                                        }
                                    >
                                        <div>
                                            <div
                                                className={
                                                    styles.date
                                                }
                                            >
                                                {formatWhen(
                                                    event.starts_at,
                                                )}
                                            </div>

                                            <div
                                                className={
                                                    styles.venue
                                                }
                                            >
                                                {event.venue
                                                    || 'Local a confirmar'}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className={
                                                styles.action
                                            }
                                            onClick={() =>
                                                onCreatePoll(
                                                    event,
                                                )
                                            }
                                        >
                                            Abrir
                                            enquete
                                            →
                                        </button>
                                    </div>
                                </article>
                            ),
                        )}
                    </div>
                )}
        </section>
    );
}