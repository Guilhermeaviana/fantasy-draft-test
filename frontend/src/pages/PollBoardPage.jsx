import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import api from '../api/client';

import CreatePollModal from '../components/CreatePollModal';
import PollCard from '../components/PollCard';

import styles from './PollBoardPage.module.css';

async function fetchPolls() {
    const response = await api.get('/api/polls');

    return response.data;
}

const filters = [
    {
        id: 'all',
        label: 'Todas',
    },
    {
        id: 'live',
        label: 'Ao vivo',
    },
    {
        id: 'closed',
        label: 'Encerradas',
    },
];

export default function PollBoardPage() {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] =
        useState(false);
    const [activeFilter, setActiveFilter] =
        useState('all');

    const loadPolls = async () => {
        setLoading(true);

        try {
            const data = await fetchPolls();

            setPolls(data);
            setError('');
        } catch {
            setError(
                'Não foi possível carregar as enquetes.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;

        fetchPolls()
            .then((data) => {
                if (!active) {
                    return;
                }

                setPolls(data);
                setError('');
            })
            .catch(() => {
                if (!active) {
                    return;
                }

                setError(
                    'Não foi possível carregar as enquetes.',
                );
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const filteredPolls = useMemo(() => {
        if (activeFilter === 'live') {
            return polls.filter(
                (poll) => poll.status === 'open',
            );
        }

        if (activeFilter === 'closed') {
            return polls.filter(
                (poll) => poll.status === 'closed',
            );
        }

        return polls;
    }, [polls, activeFilter]);

    const liveCount = polls.filter(
        (poll) => poll.status === 'open',
    ).length;

    const handleCreated = (poll) => {
        setPolls((current) => [
            poll,
            ...current,
        ]);

        setActiveFilter('all');
    };

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.eyebrow}>
                        <span className={styles.liveDot} />

                        LIVE POLLS
                    </div>

                    <h1>
                        A opinião muda.
                        <br />
                        O placar acompanha.
                    </h1>

                    <p>
                        Crie enquetes esportivas,
                        participe de votações e
                        acompanhe o consenso da
                        comunidade se formar em tempo
                        real.
                    </p>
                </div>

                <button
                    type="button"
                    className={styles.createButton}
                    onClick={() =>
                        setModalOpen(true)
                    }
                >
                    <span>+</span>
                    Criar enquete
                </button>
            </section>

            <section
                className={styles.pollSection}
                id="live-polls"
            >
                <div className={styles.toolbar}>
                    <div>
                        <span
                            className={
                                styles.sectionEyebrow
                            }
                        >
                            COMUNIDADE
                        </span>

                        <div
                            className={
                                styles.sectionTitle
                            }
                        >
                            <h2>Enquetes</h2>

                            <span>
                                {liveCount} ao vivo
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className={styles.refresh}
                        onClick={loadPolls}
                        disabled={loading}
                    >
                        {loading
                            ? 'Atualizando...'
                            : 'Atualizar'}
                    </button>
                </div>

                <div className={styles.filters}>
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            type="button"
                            className={`${styles.filter} ${
                                activeFilter
                                === filter.id
                                    ? styles.filterActive
                                    : ''
                            }`}
                            onClick={() =>
                                setActiveFilter(
                                    filter.id,
                                )
                            }
                        >
                            {filter.label}

                            {filter.id === 'live'
                                && liveCount > 0 && (
                                    <span>
                                        {liveCount}
                                    </span>
                                )}
                        </button>
                    ))}
                </div>

                {loading && polls.length === 0 && (
                    <div className={styles.state}>
                        <div
                            className={
                                styles.loader
                            }
                        />

                        <strong>
                            Carregando enquetes
                        </strong>

                        <span>
                            Buscando as votações mais
                            recentes...
                        </span>
                    </div>
                )}

                {!loading && error && (
                    <div className={styles.state}>
                        <strong>
                            Algo deu errado
                        </strong>

                        <span>{error}</span>
                    </div>
                )}

                {!loading
                    && !error
                    && filteredPolls.length
                        === 0 && (
                        <div
                            className={
                                styles.empty
                            }
                        >
                            <div
                                className={
                                    styles.emptyIcon
                                }
                            >
                                ?
                            </div>

                            <strong>
                                Nenhuma enquete nesta
                                categoria
                            </strong>

                            <span>
                                Tente outro filtro ou
                                crie uma nova votação.
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setModalOpen(true)
                                }
                            >
                                Criar enquete
                            </button>
                        </div>
                    )}

                {!error
                    && filteredPolls.length > 0 && (
                        <div className={styles.grid}>
                            {filteredPolls.map(
                                (poll) => (
                                    <PollCard
                                        key={poll.id}
                                        poll={poll}
                                    />
                                ),
                            )}
                        </div>
                    )}
            </section>

            <CreatePollModal
                open={modalOpen}
                onClose={() =>
                    setModalOpen(false)
                }
                onCreated={handleCreated}
            />
        </main>
    );
}