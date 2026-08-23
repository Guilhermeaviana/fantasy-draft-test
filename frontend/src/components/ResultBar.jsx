import styles from './ResultBar.module.css';

const resultAccents = [
    '#8b5cf6',
    '#22d3ee',
    '#37e77b',
    '#f59e0b',
    '#ff5d73',
];

export default function ResultBar({
    option,
    selected,
    index,
}) {
    const accent =
        resultAccents[index % resultAccents.length];

    return (
        <div
            className={`${styles.result} ${
                selected ? styles.selected : ''
            }`}
            style={{
                '--result-accent': accent,
                '--result-width': `${option.percentage}%`,
            }}
        >
            <div className={styles.backgroundFill} />

            <div className={styles.content}>
                <div className={styles.identity}>
                    <span className={styles.position}>
                        {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className={styles.name}>
                        <div>
                            <strong>{option.label}</strong>

                            {selected && (
                                <span
                                    className={
                                        styles.yourVote
                                    }
                                >
                                    Seu voto
                                </span>
                            )}
                        </div>

                        <span>
                            {option.votes}{' '}
                            {option.votes === 1
                                ? 'voto'
                                : 'votos'}
                        </span>
                    </div>
                </div>

                <div className={styles.percentage}>
                    <strong>
                        {option.percentage}%
                    </strong>

                    <span>preferência</span>
                </div>
            </div>

            <div className={styles.track}>
                <div className={styles.trackFill} />
            </div>
        </div>
    );
}