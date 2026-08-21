import {
    Link,
    NavLink,
} from 'react-router-dom';

import styles from './AppHeader.module.css';

export default function AppHeader() {
    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                <div className={styles.left}>
                    <Link
                        to="/"
                        className={styles.brand}
                        aria-label="FantasyDraft Live Polls"
                    >
                        <div className={styles.brandMark}>
                            <span>F</span>
                        </div>

                        <div className={styles.brandText}>
                            <strong>
                                FantasyDraft
                            </strong>

                            <span>
                                Live Polls
                            </span>
                        </div>
                    </Link>

                    <div
                        className={
                            styles.separator
                        }
                    />

                    <nav
                        className={styles.navigation}
                        aria-label="Navegação principal"
                    >
                        <NavLink
                            to="/"
                            end
                            className={({
                                isActive,
                            }) =>
                                `${styles.navItem} ${
                                    isActive
                                        ? styles.navItemActive
                                        : ''
                                }`
                            }
                        >
                            Lobby
                        </NavLink>

                        <a
                            href="/#live-polls"
                            className={
                                styles.navItem
                            }
                        >
                            Ao vivo
                        </a>

                        <a
                            href="/#closed-polls"
                            className={
                                styles.navItem
                            }
                        >
                            Encerradas
                        </a>
                    </nav>
                </div>

                <div className={styles.right}>
                    <div
                        className={
                            styles.realtimeStatus
                        }
                    >
                        <span
                            className={
                                styles.statusPulse
                            }
                        />

                        <span>
                            Realtime
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}