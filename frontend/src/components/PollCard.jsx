import { useState } from 'react';
import { Link } from 'react-router-dom';

import StatusBadge from './StatusBadge';

import styles from './PollCard.module.css';

function getActionLabel(poll) {
    if (poll.status === 'closed') {
        return 'Ver resultado';
    }

    if (poll.has_voted) {
        return 'Acompanhar';
    }

    return 'Participar';
}

function formatEventDate(value) {
    if (!value) {
        return 'Horário indefinido';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Horário indefinido';
    }

    const parts = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).formatToParts(date);

    const getPart = (type) =>
        parts.find((part) => part.type === type)?.value ?? '';

    const day = getPart('day');

    const month = getPart('month')
        .replace('.', '')
        .toUpperCase();

    const hour = getPart('hour');
    const minute = getPart('minute');

    return `${day} ${month} · ${hour}:${minute}`;
}

function getSportLabel(sport) {
    const labels = {
        Soccer: 'FUTEBOL',
        Baseball: 'BASEBALL',
        Basketball: 'BASQUETE',
    };

    return labels[sport]
        ?? String(sport ?? 'ESPORTE').toUpperCase();
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

    return labels[status]
        ?? String(status ?? 'AGENDADO').toUpperCase();
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

function getInitials(name) {
    return String(name ?? '')
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
    const [failed, setFailed] = useState(false);

    if (logo && !failed) {
        return (
            <img
                src={logo}
                alt=""
                className={styles.teamLogo}
                onError={() => setFailed(true)}
            />
        );
    }

    return (
        <span className={styles.teamFallback}>
            {getInitials(name) || '?'}
        </span>
    );
}

function SportsMatchup({
    sportsEvent,
}) {
    const home = sportsEvent.home_team;
    const away = sportsEvent.away_team;

    const hasScore =
        home?.score !== null
        && home?.score !== undefined
        && away?.score !== null
        && away?.score !== undefined;

    return (
        <div className={styles.matchup}>
            <div className={styles.team}>
                <TeamLogo
                    name={home?.name}
                    logo={home?.logo}
                />

                <span className={styles.teamName}>
                    {home?.name}
                </span>
            </div>

            <div className={styles.matchCenter}>
                {hasScore ? (
                    <strong className={styles.score}>
                        {home.score}

                        <span>:</span>

                        {away.score}
                    </strong>
                ) : (
                    <span className={styles.versus}>
                        VS
                    </span>
                )}
            </div>

            <div
                className={`${styles.team} ${styles.teamAway}`}
            >
                <TeamLogo
                    name={away?.name}
                    logo={away?.logo}
                />

                <span className={styles.teamName}>
                    {away?.name}
                </span>
            </div>
        </div>
    );
}

export default function PollCard({
    poll,
}) {
    const actionLabel = getActionLabel(poll);

    const sportsEvent = poll.sports_event;

    const visibleOptions =
        poll.options.slice(0, 3);

    const hiddenOptions = Math.max(
        poll.options.length
        - visibleOptions.length,
        0,
    );

    return (
        <Link
            to={`/polls/${poll.id}`}
            className={`${styles.card} ${
                sportsEvent
                    ? styles.sportsCard
                    : ''
            }`}
        >
            <div className={styles.glow} />

            <div className={styles.header}>
                <StatusBadge
                    status={poll.status}
                />

                <div className={styles.metric}>
                    <strong>
                        {poll.total_votes}
                    </strong>

                    <span>
                        {poll.total_votes === 1
                            ? 'voto'
                            : 'votos'}
                    </span>
                </div>
            </div>

            {sportsEvent ? (
                <div
                    className={
                        styles.sportsContent
                    }
                >
                    <div
                        className={
                            styles.eventMeta
                        }
                    >
                        <div>
                            <span
                                className={
                                    styles.league
                                }
                            >
                                {sportsEvent.league
                                    ?? getSportLabel(
                                        sportsEvent.sport,
                                    )}
                            </span>

                            <span
                                className={
                                    styles.eventDate
                                }
                            >
                                {formatEventDate(
                                    sportsEvent.starts_at,
                                )}
                            </span>
                        </div>

                        <span
                            className={`${styles.eventStatus} ${getEventStatusClass(
                                sportsEvent.status,
                            )}`}
                        >
                            {getEventStatusLabel(
                                sportsEvent.status,
                            )}
                        </span>
                    </div>

                    <SportsMatchup
                        sportsEvent={
                            sportsEvent
                        }
                    />

                    <div
                        className={
                            styles.sportsQuestion
                        }
                    >
                        <span>
                            ENQUETE DA PARTIDA
                        </span>

                        <h3>
                            {poll.question}
                        </h3>
                    </div>
                </div>
            ) : (
                <div
                    className={
                        styles.content
                    }
                >
                    <span
                        className={
                            styles.category
                        }
                    >
                        LIVE POLL
                    </span>

                    <h3>
                        {poll.question}
                    </h3>

                    <div
                        className={
                            styles.options
                        }
                    >
                        {visibleOptions.map(
                            (option) => (
                                <span
                                    key={
                                        option.id
                                    }
                                    className={
                                        styles.optionChip
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </span>
                            ),
                        )}

                        {hiddenOptions > 0 && (
                            <span
                                className={
                                    styles.moreOptions
                                }
                            >
                                +{hiddenOptions}
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div className={styles.footer}>
                <div className={styles.meta}>
                    <span>
                        {poll.options.length}{' '}

                        {poll.options.length === 1
                            ? 'opção'
                            : 'opções'}
                    </span>

                    {poll.has_voted && (
                        <>
                            <span
                                className={
                                    styles.separator
                                }
                            />

                            <span
                                className={
                                    styles.voted
                                }
                            >
                                VOTO REGISTRADO
                            </span>
                        </>
                    )}
                </div>

                <span className={styles.action}>
                    {actionLabel}

                    <span
                        className={
                            styles.arrow
                        }
                    >
                        →
                    </span>
                </span>
            </div>
        </Link>
    );
}