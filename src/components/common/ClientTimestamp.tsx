'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface ClientTimestampProps {
    timestamp: number | string | Date;
    formatString?: string;
    className?: string;
}

const ClientTimestamp: React.FC<ClientTimestampProps> = ({
    timestamp,
    formatString = 'HH:mm:ss',
    className,
}) => {
    const [formattedTime, setFormattedTime] = useState<string>('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            setFormattedTime(format(new Date(timestamp), formatString));
        }
    }, [timestamp, formatString, isMounted]);

    if (!isMounted) {
        // Render a placeholder or nothing on the server and during initial client render
        // This helps prevent hydration mismatch by ensuring the server output
        // doesn't rely on client-specific date/time.
        // An empty span with the same class can prevent layout shifts.
        return <span className={className}>&nbsp;</span>;
    }

    return <span className={className}>{formattedTime}</span>;
};

export default ClientTimestamp;