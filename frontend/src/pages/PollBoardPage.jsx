import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import api from '../api/client';

import CreatePollModal from '../components/CreatePollModal';
import LiveSportsSection from '../components/LiveSportsSection';
import PollCard from '../components/PollCard';
import ProductHero from '../components/ProductHero';

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
        id: 'open',
        label: 'Em votação',
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
        if (activeFilter === 'open') {
            return polls.filter(
                (poll) =>
                    poll.status === 'open',
            );
        }

        if (activeFilter === 'closed') {
            return polls.filter(
                (poll) =>
                    poll.status === 'closed',
            );
        }

        return polls;
    }, [
        polls,
        activeFilter,
    ]);

    const openCount = polls.filter(
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
            <ProductHero
                onCreatePoll={() =>
                    setModalOpen(true)
                }
            />

            <LiveSportsSection />

            <section
                className={
                    styles.pollSection
                }
                id="live-polls"
            >
                <div
                    className={
                        styles.toolbar
                    }
                >
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
                                {openCount} em votação
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className={
                            styles.refresh
                        }
                        onClick={loadPolls}
                        disabled={loading}
                    >
                        {loading
                            ? 'Atualizando...'
                            : 'Atualizar'}
                    </button>
                </div>

                <div
                    className={
                        styles.filters
                    }
                >
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

                            {filter.id === 'open'
                                && openCount > 0 && (
                                    <span>
                                        {openCount}
                                    </span>
                                )}
                        </button>
                    ))}
                </div>

                {loading
                    && polls.length === 0 && (
                        <div
                            className={
                                styles.state
                            }
                        >
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
                    <div
                        className={
                            styles.state
                        }
                    >
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
                        <div
                            className={
                                styles.grid
                            }
                        >
                            {filteredPolls.map(
                                (poll) => (
                                    <PollCard
                                        key={
                                            poll.id
                                        }
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