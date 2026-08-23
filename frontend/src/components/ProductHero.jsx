import styles from './ProductHero.module.css';

export default function ProductHero({
    onCreatePoll,
}) {
    return (
        <section className={styles.hero}>
            <div className={styles.content}>
                <div className={styles.eyebrow}>
                    <span
                        className={
                            styles.liveDot
                        }
                    />

                    FANTASYDRAFT LIVE
                </div>

                <h1>
                    Escolha seu lado.
                    <br />
                    Vote em tempo real.
                </h1>

                <p>
                    Crie enquetes sobre partidas,
                    vote nos seus favoritos e
                    acompanhe as escolhas da
                    comunidade enquanto elas
                    acontecem.
                </p>

                <div
                    className={
                        styles.actions
                    }
                >
                    <button
                        type="button"
                        className={
                            styles.createButton
                        }
                        onClick={onCreatePoll}
                    >
                        <span>+</span>
                        Criar enquete
                    </button>

                    <span
                        className={
                            styles.realtimeNote
                        }
                    >
                        <span
                            className={
                                styles.realtimeDot
                            }
                        />

                        Atualizações via WebSocket
                    </span>
                </div>
            </div>

            <div
                className={
                    styles.previewWrapper
                }
                aria-hidden="true"
            >
                <div
                    className={
                        styles.glow
                    }
                />

                <div
                    className={
                        styles.preview
                    }
                >
                    <div
                        className={
                            styles.previewHeader
                        }
                    >
                        <div>
                            <span>
                                LIVE POLL
                            </span>

                            <strong>
                                Enquete esportiva
                            </strong>
                        </div>

                        <span
                            className={
                                styles.realtimeBadge
                            }
                        >
                            <span
                                className={
                                    styles.realtimeDot
                                }
                            />

                            REALTIME
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
                            <span
                                className={
                                    styles.teamMark
                                }
                            >
                                H
                            </span>

                            <div>
                                <small>
                                    MANDANTE
                                </small>

                                <strong>
                                    Time da casa
                                </strong>
                            </div>
                        </div>

                        <span
                            className={
                                styles.versus
                            }
                        >
                            VS
                        </span>

                        <div
                            className={`${styles.team} ${styles.awayTeam}`}
                        >
                            <span
                                className={
                                    styles.teamMark
                                }
                            >
                                A
                            </span>

                            <div>
                                <small>
                                    VISITANTE
                                </small>

                                <strong>
                                    Time visitante
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div
                        className={
                            styles.question
                        }
                    >
                        <span>
                            QUEM VENCE?
                        </span>

                        <strong>
                            Escolha seu favorito
                        </strong>
                    </div>

                    <div
                        className={
                            styles.options
                        }
                    >
                        <div
                            className={`${styles.option} ${styles.optionFirst}`}
                        >
                            <span
                                className={
                                    styles.optionIndex
                                }
                            >
                                01
                            </span>

                            <strong>
                                Mandante
                            </strong>

                            <span
                                className={
                                    styles.choice
                                }
                            />
                        </div>

                        <div
                            className={`${styles.option} ${styles.optionSecond}`}
                        >
                            <span
                                className={
                                    styles.optionIndex
                                }
                            >
                                02
                            </span>

                            <strong>
                                Visitante
                            </strong>

                            <span
                                className={
                                    styles.choice
                                }
                            />
                        </div>
                    </div>

                    <div
                        className={
                            styles.sync
                        }
                    >
                        <span
                            className={
                                styles.syncPulse
                            }
                        />

                        <span>
                            Votos sincronizados
                            instantaneamente
                        </span>

                        <strong>
                            LIVE
                        </strong>
                    </div>
                </div>
            </div>
        </section>
    );
}