import {
    Link,
    useLocation,
} from 'react-router-dom';

import styles from './AppHeader.module.css';

export default function AppHeader() {
    const location = useLocation();

    const isLobby =
        location.pathname === '/'
        && location.hash !== '#live-polls'
        && location.hash !== '#closed-polls';

    const isOpenPolls =
        location.pathname === '/'
        && location.hash === '#live-polls';

    const isClosedPolls =
        location.pathname === '/'
        && location.hash === '#closed-polls';

    const navClassName = (active) =>
        `${styles.navItem} ${
            active
                ? styles.navItemActive
                : ''
        }`;

    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                <div className={styles.left}>
                    <Link
                        to="/"
                        className={styles.brand}
                        aria-label="FantasyDraft Live Polls"
                    >
                        <div
                            className={
                                styles.brandMark
                            }
                        >
                            <span>F</span>
                        </div>

                        <div
                            className={
                                styles.brandText
                            }
                        >
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
                        className={
                            styles.navigation
                        }
                        aria-label="Navegação principal"
                    >
                        <Link
                            to="/"
                            className={navClassName(
                                isLobby,
                            )}
                        >
                            Lobby
                        </Link>

                        <Link
                            to="/#live-polls"
                            className={navClassName(
                                isOpenPolls,
                            )}
                        >
                            Em votação
                        </Link>

                        <Link
                            to="/#closed-polls"
                            className={navClassName(
                                isClosedPolls,
                            )}
                        >
                            Encerradas
                        </Link>
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