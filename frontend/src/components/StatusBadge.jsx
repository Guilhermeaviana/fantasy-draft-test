import styles from './StatusBadge.module.css';

export default function StatusBadge({ status }) {
    const isOpen = status === 'open';

    return (
        <span
            className={`${styles.badge} ${
                isOpen ? styles.live : styles.closed
            }`}
        >
            {isOpen && (
                <span className={styles.dot} />
            )}

            {isOpen
                ? 'EM VOTAÇÃO'
                : 'ENCERRADA'}
        </span>
    );
}