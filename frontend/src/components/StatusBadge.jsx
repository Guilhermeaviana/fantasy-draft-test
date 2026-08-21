import styles from './StatusBadge.module.css';

export default function StatusBadge({ status }) {
    const isLive = status === 'open';

    return (
        <span
            className={`${styles.badge} ${
                isLive ? styles.live : styles.closed
            }`}
        >
            {isLive && (
                <span className={styles.dot} />
            )}

            {isLive ? 'AO VIVO' : 'ENCERRADA'}
        </span>
    );
}