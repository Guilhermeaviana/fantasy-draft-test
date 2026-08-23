import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import api from '../api/client';

import styles from './CreatePollModal.module.css';

const sports = [
    {
        value: 'Baseball',
        label: 'Baseball',
        icon: '⚾',
    },
    {
        value: 'Soccer',
        label: 'Futebol',
        icon: '⚽',
    },
    {
        value: 'Basketball',
        label: 'Basquete',
        icon: '🏀',
    },
];

function getLocalDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(
        today.getMonth() + 1,
    ).padStart(2, '0');

    const day = String(
        today.getDate(),
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatEventDate(value) {
    if (!value) {
        return 'Horário não informado';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Horário não informado';
    }

    return new Intl.DateTimeFormat(
        'pt-BR',
        {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        },
    ).format(date);
}

function getInitials(name) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function TeamLogo({
    name,
    logo,
}) {
    const [imageFailed, setImageFailed] =
        useState(false);

    if (logo && !imageFailed) {
        return (
            <img
                src={logo}
                alt=""
                className={styles.teamLogo}
                onError={() =>
                    setImageFailed(true)
                }
            />
        );
    }

    return (
        <span className={styles.teamFallback}>
            {getInitials(name)}
        </span>
    );
}

function buildQuestion(homeTeam, awayTeam) {
    return `Quem vence ${homeTeam} x ${awayTeam}?`;
}

export default function CreatePollModal({
    open,
    onClose,
    onCreated,
    initialSportsEvent = null,
}) {
    const [mode, setMode] =
    useState(
        initialSportsEvent
            ? 'sports'
            : 'free',
    );

    const [question, setQuestion] =
        useState(
            initialSportsEvent
                ? buildQuestion(
                    initialSportsEvent
                        .home_team
                        .name,
                    initialSportsEvent
                        .away_team
                        .name,
                )
                : '',
        );

    const [options, setOptions] =
        useState(
            initialSportsEvent
                ? [
                    initialSportsEvent
                        .home_team
                        .name,
                    initialSportsEvent
                        .away_team
                        .name,
                ]
                : ['', ''],
        );

    const [duration, setDuration] =
        useState('15');

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState('');

    const [selectedSport, setSelectedSport] =
    useState(
        initialSportsEvent?.sport
        ?? 'Soccer',
    );

    const [sportsEvents, setSportsEvents] =
        useState(
            initialSportsEvent
                ? [initialSportsEvent]
                : [],
        );

    const [selectedEventId, setSelectedEventId] =
        useState(
            initialSportsEvent?.id
            ?? null,
        );

    const [eventsLoading, setEventsLoading] =
        useState(false);

    const [eventsError, setEventsError] =
        useState('');

    const applySportsEvent = (
        sportsEvent,
    ) => {
        if (!sportsEvent) {
            return;
        }

        const homeTeam =
            sportsEvent.home_team.name;
        const awayTeam =
            sportsEvent.away_team.name;

        setMode('sports');
        setSelectedSport(
            sportsEvent.sport
            ?? 'Soccer',
        );
        setSelectedEventId(
            sportsEvent.id,
        );
        setQuestion(
            buildQuestion(
                homeTeam,
                awayTeam,
            ),
        );
        setOptions([
            homeTeam,
            awayTeam,
        ]);
        setError('');
    };



    useEffect(() => {
        if (
            !open
            || mode !== 'sports'
        ) {
            return undefined;
        }

        let active = true;

        const loadEvents = async () => {
            setEventsLoading(true);
            setEventsError('');

            try {
                const response =
                    await api.get(
                        '/api/sports-events',
                        {
                            params: {
                                date: getLocalDate(),
                                days: 7,
                                sport:
                                    selectedSport,
                                eligible_for_poll: 1,
                            },
                        },
                    );

                if (!active) {
                    return;
                }

                const events =
                    Array.isArray(
                        response.data,
                    )
                        ? response.data
                        : [];

                if (
                    initialSportsEvent
                    && initialSportsEvent.sport
                        === selectedSport
                    && !events.some(
                        (event) =>
                            event.id
                            === initialSportsEvent.id,
                    )
                ) {
                    setSportsEvents([
                        initialSportsEvent,
                        ...events,
                    ]);
                } else {
                    setSportsEvents(events);
                }
            } catch {
                if (!active) {
                    return;
                }

                setSportsEvents([]);

                setEventsError(
                    'Não foi possível carregar os eventos esportivos.',
                );
            } finally {
                if (active) {
                    setEventsLoading(false);
                }
            }
        };

        loadEvents();

        return () => {
            active = false;
        };
    }, [
        open,
        mode,
        selectedSport,
        initialSportsEvent,
    ]);

    const selectedEvent = useMemo(
        () =>
            sportsEvents.find(
                (event) =>
                    event.id
                    === selectedEventId,
            ) ?? null,
        [
            sportsEvents,
            selectedEventId,
        ],
    );

    const resolvedSelectedEvent =
        selectedEvent
        ?? (
            initialSportsEvent
            && initialSportsEvent.id
                === selectedEventId
                ? initialSportsEvent
                : null
        );

    if (!open) {
        return null;
    }

    const resetForm = () => {
        setMode('free');
        setQuestion('');
        setOptions(['', '']);
        setDuration('15');
        setError('');

        setSelectedSport('Soccer');
        setSportsEvents([]);
        setSelectedEventId(null);
        setEventsError('');
    };

    const closeModal = () => {
        resetForm();
        onClose();
    };

    const changeMode = (nextMode) => {
        if (nextMode === mode) {
            return;
        }

        setMode(nextMode);
        setQuestion('');
        setOptions(['', '']);
        setSelectedEventId(null);
        setError('');
        setEventsError('');
    };

    const changeSport = (sport) => {
        setSelectedSport(sport);
        setSelectedEventId(null);
        setQuestion('');
        setOptions(['', '']);
    };

    const selectSportsEvent = (
        sportsEvent,
    ) => {
        if (
            sportsEvent.status
            === 'finished'
            || sportsEvent.status
            === 'postponed'
        ) {
            return;
        }

        applySportsEvent(
            sportsEvent,
        );
    };

    const updateOption = (
        index,
        value,
    ) => {
        setOptions((current) =>
            current.map(
                (
                    option,
                    optionIndex,
                ) =>
                    optionIndex === index
                        ? value
                        : option,
            ),
        );
    };

    const addOption = () => {
        if (options.length < 10) {
            setOptions((current) => [
                ...current,
                '',
            ]);
        }
    };

    const removeOption = (index) => {
        if (options.length <= 2) {
            return;
        }

        setOptions((current) =>
            current.filter(
                (_, optionIndex) =>
                    optionIndex !== index,
            ),
        );
    };

    const handleSubmit = async (
        event,
    ) => {
        event.preventDefault();

        if (
            mode === 'sports'
            && !resolvedSelectedEvent
        ) {
            setError(
                'Selecione um evento esportivo antes de criar a enquete.',
            );

            return;
        }

        const normalizedOptions =
            options.map((option) =>
                option.trim(),
            );

        if (
            normalizedOptions.length < 2
            || normalizedOptions.some(
                (option) =>
                    option.length === 0,
            )
        ) {
            setError(
                'Preencha pelo menos duas opções.',
            );

            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const payload = {
                question:
                    question.trim(),
                options:
                    normalizedOptions,
                duration_minutes:
                    duration === ''
                        ? null
                        : Number(
                            duration,
                        ),
            };

            if (
                mode === 'sports'
                && resolvedSelectedEvent
            ) {
                payload.sports_event_id =
                    resolvedSelectedEvent.id;
            }

            const response =
                await api.post(
                    '/api/polls',
                    payload,
                );

            onCreated(response.data);

            resetForm();
            onClose();
        } catch (requestError) {
            setError(
                requestError.response
                    ?.data?.message
                ?? 'Não foi possível criar a enquete.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className={styles.backdrop}
            onMouseDown={closeModal}
        >
            <div
                className={styles.modal}
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <div className={styles.heading}>
                    <div>
                        <span>
                            NOVA ENQUETE
                        </span>

                        <h2>
                            Criar votação
                        </h2>

                        <p>
                            Publique uma
                            enquete livre
                            ou conecte a
                            votação a um
                            evento
                            esportivo
                            real.
                        </p>
                    </div>

                    <button
                        type="button"
                        className={styles.close}
                        onClick={closeModal}
                        aria-label="Fechar modal"
                    >
                        ×
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                >
                    <div
                        className={
                            styles.modeSelector
                        }
                    >
                        <button
                            type="button"
                            className={`${styles.modeButton} ${
                                mode === 'free'
                                    ? styles.modeButtonActive
                                    : ''
                            }`}
                            onClick={() =>
                                changeMode(
                                    'free',
                                )
                            }
                        >
                            <span
                                className={
                                    styles.modeIcon
                                }
                            >
                                ?
                            </span>

                            <span>
                                <strong>
                                    Enquete
                                    livre
                                </strong>

                                <small>
                                    Crie
                                    qualquer
                                    votação
                                </small>
                            </span>
                        </button>

                        <button
                            type="button"
                            className={`${styles.modeButton} ${
                                mode
                                === 'sports'
                                    ? styles.modeButtonActive
                                    : ''
                            }`}
                            onClick={() =>
                                changeMode(
                                    'sports',
                                )
                            }
                        >
                            <span
                                className={
                                    styles.modeIcon
                                }
                            >
                                ◉
                            </span>

                            <span>
                                <strong>
                                    Evento
                                    esportivo
                                </strong>

                                <small>
                                    Use
                                    partidas
                                    reais
                                </small>
                            </span>
                        </button>
                    </div>

                    {mode === 'sports' && (
                        <section
                            className={
                                styles.sportsSection
                            }
                        >
                            <div
                                className={
                                    styles.sportsHeader
                                }
                            >
                                <div>
                                    <span>
                                        PRÓXIMOS
                                        EVENTOS
                                    </span>

                                    <strong>
                                        Escolha
                                        uma
                                        partida
                                    </strong>
                                </div>

                                <span
                                    className={
                                        styles.liveDataBadge
                                    }
                                >
                                    LIVE DATA
                                </span>
                            </div>

                            <div
                                className={
                                    styles.sportTabs
                                }
                            >
                                {sports.map(
                                    (sport) => (
                                        <button
                                            key={
                                                sport.value
                                            }
                                            type="button"
                                            className={`${styles.sportTab} ${
                                                selectedSport
                                                === sport.value
                                                    ? styles.sportTabActive
                                                    : ''
                                            }`}
                                            onClick={() =>
                                                changeSport(
                                                    sport.value,
                                                )
                                            }
                                        >
                                            <span>
                                                {
                                                    sport.icon
                                                }
                                            </span>

                                            {
                                                sport.label
                                            }
                                        </button>
                                    ),
                                )}
                            </div>

                            {eventsLoading && (
                                <div
                                    className={
                                        styles.eventState
                                    }
                                >
                                    <div
                                        className={
                                            styles.loader
                                        }
                                    />

                                    <strong>
                                        Buscando
                                        eventos
                                    </strong>

                                    <span>
                                        Atualizando
                                        os jogos
                                        disponíveis...
                                    </span>
                                </div>
                            )}

                            {!eventsLoading
                                && eventsError && (
                                    <div
                                        className={
                                            styles.eventError
                                        }
                                    >
                                        {
                                            eventsError
                                        }
                                    </div>
                                )}

                            {!eventsLoading
                                && !eventsError
                                && sportsEvents.length
                                    === 0 && (
                                    <div
                                        className={
                                            styles.eventState
                                        }
                                    >
                                        <span
                                            className={
                                                styles.noEventsIcon
                                            }
                                        >
                                            —
                                        </span>

                                        <strong>
                                            Nenhuma
                                            partida
                                            disponível
                                        </strong>

                                        <span>
                                            Não
                                            encontramos
                                            eventos
                                            elegíveis
                                            nos
                                            próximos
                                            7 dias.
                                        </span>
                                    </div>
                                )}

                            {!eventsLoading
                                && sportsEvents.length
                                    > 0 && (
                                    <div
                                        className={
                                            styles.eventList
                                        }
                                    >
                                        {sportsEvents.map(
                                            (
                                                sportsEvent,
                                            ) => {
                                                const disabled =
                                                    sportsEvent.status
                                                    === 'finished'
                                                    || sportsEvent.status
                                                    === 'postponed';

                                                const selected =
                                                    selectedEventId
                                                    === sportsEvent.id;

                                                return (
                                                    <button
                                                        key={
                                                            sportsEvent.id
                                                        }
                                                        type="button"
                                                        disabled={
                                                            disabled
                                                        }
                                                        className={`${styles.eventCard} ${
                                                            selected
                                                                ? styles.eventCardSelected
                                                                : ''
                                                        } ${
                                                            disabled
                                                                ? styles.eventCardDisabled
                                                                : ''
                                                        }`}
                                                        onClick={() =>
                                                            selectSportsEvent(
                                                                sportsEvent,
                                                            )
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.eventMeta
                                                            }
                                                        >
                                                            <span>
                                                                {
                                                                    sportsEvent.league
                                                                }
                                                            </span>

                                                            <strong>
                                                                {formatEventDate(
                                                                    sportsEvent.starts_at,
                                                                )}
                                                            </strong>
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
                                                                <TeamLogo
                                                                    name={
                                                                        sportsEvent.home_team.name
                                                                    }
                                                                    logo={
                                                                        sportsEvent.home_team.logo
                                                                    }
                                                                />

                                                                <strong>
                                                                    {
                                                                        sportsEvent.home_team.name
                                                                    }
                                                                </strong>
                                                            </div>

                                                            <div
                                                                className={
                                                                    styles.versus
                                                                }
                                                            >
                                                                <span>
                                                                    VS
                                                                </span>
                                                            </div>

                                                            <div
                                                                className={
                                                                    styles.team
                                                                }
                                                            >
                                                                <TeamLogo
                                                                    name={
                                                                        sportsEvent.away_team.name
                                                                    }
                                                                    logo={
                                                                        sportsEvent.away_team.logo
                                                                    }
                                                                />

                                                                <strong>
                                                                    {
                                                                        sportsEvent.away_team.name
                                                                    }
                                                                </strong>
                                                            </div>
                                                        </div>

                                                        {selected && (
                                                            <span
                                                                className={
                                                                    styles.selectedLabel
                                                                }
                                                            >
                                                                ✓
                                                                EVENTO
                                                                SELECIONADO
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                        </section>
                    )}

                    {mode === 'sports'
                        && resolvedSelectedEvent && (
                            <div
                                className={
                                    styles.selectedEventSummary
                                }
                            >
                                <span>
                                    EVENTO
                                    VINCULADO
                                </span>

                                <strong>
                                    {
                                        resolvedSelectedEvent
                                            .home_team
                                            .name
                                    }
                                    {' × '}
                                    {
                                        resolvedSelectedEvent
                                            .away_team
                                            .name
                                    }
                                </strong>

                                <small>
                                    {
                                        resolvedSelectedEvent.league
                                    }
                                    {' · '}
                                    {formatEventDate(
                                        resolvedSelectedEvent.starts_at,
                                    )}
                                </small>
                            </div>
                        )}

                    <label className={styles.field}>
                        <span>
                            Pergunta
                        </span>

                        <input
                            value={question}
                            onChange={(
                                event,
                            ) =>
                                setQuestion(
                                    event.target
                                        .value,
                                )
                            }
                            maxLength={255}
                            placeholder="Quem vence o confronto de hoje?"
                            required
                        />
                    </label>

                    <div
                        className={
                            styles.optionsHeader
                        }
                    >
                        <span>
                            Opções
                        </span>

                        <small>
                            2 a 10
                            alternativas
                        </small>
                    </div>

                    <div className={styles.options}>
                        {options.map(
                            (
                                option,
                                index,
                            ) => (
                                <div
                                    className={
                                        styles.optionRow
                                    }
                                    key={index}
                                >
                                    <span
                                        className={
                                            styles.number
                                        }
                                    >
                                        {String(
                                            index
                                            + 1,
                                        ).padStart(
                                            2,
                                            '0',
                                        )}
                                    </span>

                                    <input
                                        value={
                                            option
                                        }
                                        maxLength={
                                            120
                                        }
                                        required
                                        placeholder={`Opção ${
                                            index
                                            + 1
                                        }`}
                                        onChange={(
                                            event,
                                        ) =>
                                            updateOption(
                                                index,
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                    />

                                    {options.length >
                                        2 && (
                                        <button
                                            type="button"
                                            className={
                                                styles.removeOption
                                            }
                                            onClick={() =>
                                                removeOption(
                                                    index,
                                                )
                                            }
                                            aria-label={`Remover opção ${
                                                index
                                                + 1
                                            }`}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ),
                        )}
                    </div>

                    {options.length < 10 && (
                        <button
                            className={
                                styles.addOption
                            }
                            type="button"
                            onClick={addOption}
                        >
                            + Adicionar
                            opção
                        </button>
                    )}

                    <label className={styles.field}>
                        <span>
                            Duração
                        </span>

                        <select
                            value={duration}
                            onChange={(
                                event,
                            ) =>
                                setDuration(
                                    event.target
                                        .value,
                                )
                            }
                        >
                            <option value="1">
                                1 minuto
                            </option>
                            <option value="5">
                                5 minutos
                            </option>
                            <option value="15">
                                15 minutos
                            </option>
                            <option value="30">
                                30 minutos
                            </option>
                            <option value="60">
                                1 hora
                            </option>
                            <option value="">
                                Sem limite
                            </option>
                        </select>
                    </label>

                    {error && (
                        <div
                            className={
                                styles.error
                            }
                        >
                            {error}
                        </div>
                    )}

                    <div
                        className={
                            styles.actions
                        }
                    >
                        <button
                            type="button"
                            className={
                                styles.cancel
                            }
                            onClick={closeModal}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className={
                                styles.submit
                            }
                            disabled={
                                submitting
                                || (
                                    mode
                                    === 'sports'
                                    && !resolvedSelectedEvent
                                )
                            }
                        >
                            {submitting
                                ? 'Criando...'
                                : mode
                                === 'sports'
                                    ? 'Criar enquete esportiva'
                                    : 'Criar enquete'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}