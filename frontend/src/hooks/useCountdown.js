import { useEffect, useRef, useState } from 'react';

function calculateRemainingSeconds(closesAt, currentTime) {
    if (!closesAt) {
        return null;
    }

    const difference =
        new Date(closesAt).getTime() - currentTime;

    return Math.max(Math.ceil(difference / 1000), 0);
}

function formatRemainingTime(seconds) {
    if (seconds === null) {
        return 'Sem limite';
    }

    if (seconds <= 0) {
        return 'Encerrando...';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(
        (seconds % 3600) / 60,
    );
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(
        remainingSeconds,
    ).padStart(2, '0')}`;
}

export function useCountdown(
    closesAt,
    status,
    onExpire,
) {
    const [currentTime, setCurrentTime] = useState(
        () => Date.now(),
    );

    const onExpireRef = useRef(onExpire);
    const expirationHandledRef = useRef(false);

    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    useEffect(() => {
        expirationHandledRef.current = false;
    }, [closesAt, status]);

    useEffect(() => {
        if (!closesAt || status === 'closed') {
            return undefined;
        }

        const interval = window.setInterval(() => {
            const now = Date.now();

            setCurrentTime(now);

            const remaining =
                calculateRemainingSeconds(
                    closesAt,
                    now,
                );

            if (
                remaining === 0
                && !expirationHandledRef.current
            ) {
                expirationHandledRef.current = true;
                onExpireRef.current?.();
            }
        }, 1000);

        return () => {
            window.clearInterval(interval);
        };
    }, [closesAt, status]);

    const remainingSeconds =
        status === 'closed'
            ? 0
            : calculateRemainingSeconds(
                closesAt,
                currentTime,
            );

    return {
        remainingSeconds,
        isExpired:
            remainingSeconds !== null
            && remainingSeconds <= 0,
        label: formatRemainingTime(
            remainingSeconds,
        ),
    };
}