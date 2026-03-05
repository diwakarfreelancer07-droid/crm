"use client";

/**
 * hooks/use-call-notifications.ts
 * Listens for Exotel call events emitted by the server via Socket.IO.
 * Returns reactive state for incomingCall, connectedCall, callEnded.
 */

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './use-socket';

export interface IncomingCallData {
    callSid: string;
    callerPhone: string;
    callerName: string | null;
    leadId: string | null;
    studentId: string | null;
    direction: string;
}

export interface ConnectedCallData {
    callSid: string;
    direction: string;
}

export interface EndedCallData {
    callSid: string;
    status: string;
    missed?: boolean;
    duration?: number | null;
    recordingUrl?: string | null;
    leadId?: string | null;
    studentId?: string | null;
    leadName?: string | null;
}

export function useCallNotifications() {
    const { socket, isConnected } = useSocket();
    const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
    const [connectedCall, setConnectedCall] = useState<ConnectedCallData | null>(null);
    const [callEnded, setCallEnded] = useState<EndedCallData | null>(null);

    const clearIncoming = useCallback(() => setIncomingCall(null), []);
    const clearConnected = useCallback(() => setConnectedCall(null), []);
    const clearCallEnded = useCallback(() => setCallEnded(null), []);

    useEffect(() => {
        if (!socket) return;

        const onIncoming = (data: IncomingCallData) => {
            setIncomingCall(data);
        };

        const onConnected = (data: ConnectedCallData) => {
            setConnectedCall(data);
            setIncomingCall(null); // clear ringing state
        };

        const onEnded = (data: EndedCallData) => {
            setCallEnded(data);
            setIncomingCall(null);
            setConnectedCall(null);
        };

        socket.on('call:incoming', onIncoming);
        socket.on('call:connected', onConnected);
        socket.on('call:ended', onEnded);

        return () => {
            socket.off('call:incoming', onIncoming);
            socket.off('call:connected', onConnected);
            socket.off('call:ended', onEnded);
        };
    }, [socket]);

    return {
        socket,
        isConnected,
        incomingCall,
        connectedCall,
        callEnded,
        clearIncoming,
        clearConnected,
        clearCallEnded,
    };
}
