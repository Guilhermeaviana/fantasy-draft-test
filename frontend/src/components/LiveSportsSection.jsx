import {
    useEffect,
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

function getInitials(name) {
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
    const [imageFailed, setImageFailed] =
        useState(false);

    if (logo && !imageFailed) {
        return (
            <img
                src={logo}
                alt=""
                className={styles.teamLogo}
                onError={() =>
                    setImageFailed(true)
                }
            />
        );
    }

    return (
        <span className={styles.teamFallback}>
            {getInitials(name)}
        </span>
    );
}

function formatScore(score) {
    return Number.isInteger(score)
        ? score
        : '—';
}

export default function LiveSportsSection() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        let active = true;

        const loadEvents = async () => {
            try {
                const response =
                    await api.get(
                        '/api/sports-events',
                        {
                            params: {
                                date: getLocalDate(),
                                status: 'live',
                            },
                        },
                    );

                if (!active) {
                    return;
                }

                const data =
                    Array.isArray(response.data)
                        ? response.data
                        : [];

                setEvents(data);
            } catch {
                if (active) {
                    /*
                     * O feed esportivo é complementar.
                     * Uma falha externa não deve bloquear
                     * o mural principal de enquetes.
                     */
                    setEvents([]);
                }
            }
        };

        loadEvents();

        return () => {
            active = false;
        };
    }, []);

    if (events.length === 0) {
        return null;
    }

    return (
        <section
            className={styles.section}
            aria-labelledby="live-sports-title"
        >
            <div className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>
                        <span
                            className={styles.liveDot}
                        />

                        AO VIVO AGORA
                    </span>

                    <h2 id="live-sports-title">
                        Partidas em andamento
                    </h2>
                </div>

                <span className={styles.count}>
                    {events.length}{' '}
                    {events.length === 1
                        ? 'partida'
                        : 'partidas'}
                </span>
            </div>

            <div className={styles.grid}>
                {events.map((sportsEvent) => (
                    <article
                        key={sportsEvent.id}
                        className={styles.card}
                    >
                        <div
                            className={
                                styles.cardHeader
                            }
                        >
                            <span>
                                {sportsEvent.league
                                    ?? sportsEvent.sport}
                            </span>

                            <span
                                className={
                                    styles.liveBadge
                                }
                            >
                                <span
                                    className={
                                        styles.liveDot
                                    }
                                />

                                AO VIVO
                            </span>
                        </div>

                        <div
                            className={
                                styles.matchup
                            }
                        >
                            <div
                                className={
                                    styles.team
                                }
                            >
                                <TeamLogo
                                    name={
                                        sportsEvent
                                            .home_team
                                            .name
                                    }
                                    logo={
                                        sportsEvent
                                            .home_team
                                            .logo
                                    }
                                />

                                <strong>
                                    {
                                        sportsEvent
                                            .home_team
                                            .name
                                    }
                                </strong>
                            </div>

                            <div
                                className={
                                    styles.score
                                }
                                aria-label="Placar atual"
                            >
                                <strong>
                                    {formatScore(
                                        sportsEvent
                                            .home_team
                                            .score,
                                    )}
                                </strong>

                                <span>:</span>

                                <strong>
                                    {formatScore(
                                        sportsEvent
                                            .away_team
                                            .score,
                                    )}
                                </strong>
                            </div>

                            <div
                                className={`${styles.team} ${styles.awayTeam}`}
                            >
                                <TeamLogo
                                    name={
                                        sportsEvent
                                            .away_team
                                            .name
                                    }
                                    logo={
                                        sportsEvent
                                            .away_team
                                            .logo
                                    }
                                />

                                <strong>
                                    {
                                        sportsEvent
                                            .away_team
                                            .name
                                    }
                                </strong>
                            </div>
                        </div>

                        {sportsEvent.venue && (
                            <div
                                className={
                                    styles.venue
                                }
                            >
                                {sportsEvent.venue}
                            </div>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}