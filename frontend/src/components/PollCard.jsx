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

export default function PollCard({ poll }) {
    const actionLabel = getActionLabel(poll);

    const visibleOptions = poll.options.slice(0, 3);
    const hiddenOptions =
        Math.max(poll.options.length - visibleOptions.length, 0);

    return (
        <Link
            to={`/polls/${poll.id}`}
            className={styles.card}
        >
            <div className={styles.glow} />

            <div className={styles.header}>
                <StatusBadge status={poll.status} />

                <div className={styles.metric}>
                    <strong>{poll.total_votes}</strong>

                    <span>
                        {poll.total_votes === 1
                            ? 'voto'
                            : 'votos'}
                    </span>
                </div>
            </div>

            <div className={styles.content}>
                <span className={styles.category}>
                    LIVE POLL
                </span>

                <h3>{poll.question}</h3>

                <div className={styles.options}>
                    {visibleOptions.map((option) => (
                        <span
                            key={option.id}
                            className={styles.optionChip}
                        >
                            {option.label}
                        </span>
                    ))}

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

                    <span className={styles.arrow}>
                        →
                    </span>
                </span>
            </div>
        </Link>
    );
}