import { Link } from 'react-router-dom';
import styles from './AppHeader.module.css';

export default function AppHeader() {
    return (
        <header className={styles.header}>
            <Link to="/" className={styles.brand}>
                <span className={styles.brandMark}>F</span>

                <div>
                    <strong>FantasyDraft</strong>
                    <span>Polls</span>
                </div>
            </Link>

            <div className={styles.badge}>
                DESAFIO AO VIVO
            </div>
        </header>
    );
}