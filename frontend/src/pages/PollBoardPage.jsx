import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import CreatePollModal from '../components/CreatePollModal';
import styles from './PollBoardPage.module.css';

export default function PollBoardPage() {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    const loadPolls = async () => {
        try {
            const response = await api.get('/api/polls');
            setPolls(response.data);
            setError('');
        } catch {
            setError('Não foi possível carregar as enquetes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPolls();
    }, []);

    const handleCreated = (poll) => {
        setPolls((current) => [poll, ...current]);
    };

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div>
                    <span className={styles.eyebrow}>
                        MURAL DE ENQUETES
                    </span>

                    <h1>Decida em tempo real.</h1>

                    <p>
                        Crie uma votação, participe e acompanhe os
                        resultados mudarem ao vivo.
                    </p>
                </div>

                <button
                    className={styles.createButton}
                    onClick={() => setModalOpen(true)}
                >
                    + Nova enquete
                </button>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeading}>
                    <div>
                        <h2>Enquetes</h2>
                        <span>
                            {polls.length} disponíveis
                        </span>
                    </div>

                    <button
                        className={styles.refresh}
                        onClick={loadPolls}
                    >
                        Atualizar
                    </button>
                </div>

                {loading && (
                    <div className={styles.state}>
                        Carregando enquetes...
                    </div>
                )}

                {!loading && error && (
                    <div className={styles.state}>{error}</div>
                )}

                {!loading && !error && polls.length === 0 && (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>?</div>
                        <h3>Nenhuma enquete criada</h3>
                        <p>
                            Crie a primeira votação e acompanhe os
                            resultados em tempo real.
                        </p>

                        <button
                            onClick={() => setModalOpen(true)}
                        >
                            Criar enquete
                        </button>
                    </div>
                )}

                <div className={styles.grid}>
                    {polls.map((poll) => (
                        <Link
                            to={`/polls/${poll.id}`}
                            className={styles.card}
                            key={poll.id}
                        >
                            <div className={styles.cardTop}>
                                <span
                                    className={
                                        poll.status === 'open'
                                            ? styles.live
                                            : styles.closed
                                    }
                                >
                                    {poll.status === 'open'
                                        ? '● AO VIVO'
                                        : 'ENCERRADA'}
                                </span>

                                <span className={styles.votes}>
                                    {poll.total_votes}{' '}
                                    {poll.total_votes === 1
                                        ? 'voto'
                                        : 'votos'}
                                </span>
                            </div>

                            <h3>{poll.question}</h3>

                            <div className={styles.optionPreview}>
                                {poll.options
                                    .slice(0, 3)
                                    .map((option) => (
                                        <span key={option.id}>
                                            {option.label}
                                        </span>
                                    ))}
                            </div>

                            <div className={styles.cardFooter}>
                                <span>
                                    {poll.options.length} opções
                                </span>
                                <strong>Participar →</strong>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <CreatePollModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={handleCreated}
            />
        </main>
    );
}