import { useEffect, useCallback } from 'react';

export type CallTab = 'status' | 'dialpad' | 'history';

export interface KeyboardNavOptions {
    callTab: CallTab;
    hasActiveCall: boolean;
    hasIncomingCall: boolean;
    dialpadActive: boolean;
    dialNumber: string;               // current dial buffer — used to decide Esc behavior

    // List Navigation State
    historyLength: number;
    selectedHistoryIdx: number;
    customerResultsLength: number;
    selectedCustomerIdx: number;

    // Actions
    setCallTab: (t: CallTab) => void;
    answerCall: () => void;
    rejectCall: () => void;
    endCall: () => void;

    // Dialpad
    dialKey: (k: string) => void;
    dialBackspace: () => void;
    clearDialNumber: () => void;
    handleDial: () => void;

    // Lists
    setSelectedHistoryIdx: (i: number | ((prev: number) => number)) => void;
    redialByIdx: (i: number) => void;
    setSelectedCustomerIdx: (i: number | ((prev: number) => number)) => void;
    enterCustomer: () => void;

    // UI
    closeDetailPanel: () => void;
    toggleHelp: () => void;
}

/** Returns true when the event target is a text input (not button/checkbox) */
function isTextInput(e: KeyboardEvent) {
    const el = e.target as HTMLInputElement;
    const tag = el.tagName;
    const type = el.type;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) && !['button', 'submit', 'checkbox', 'radio'].includes(type)) return true;
    if ((e.target as HTMLElement).isContentEditable) return true;
    return false;
}

export function useCallCenterKeyboard(opts: KeyboardNavOptions) {
    const handler = useCallback((e: KeyboardEvent) => {
        const inText = isTextInput(e);

        // ── Global — always active ────────────────────────────────────────
        if (e.key === '?' && !inText) { e.preventDefault(); opts.toggleHelp(); return; }

        // ── Ctrl+1/2/3 — tab switching that ALWAYS works, even from dialpad ──
        if (e.ctrlKey) {
            if (e.key === '1') { e.preventDefault(); opts.setCallTab('status'); return; }
            if (e.key === '2') { e.preventDefault(); opts.setCallTab('dialpad'); return; }
            if (e.key === '3') { e.preventDefault(); opts.setCallTab('history'); return; }
        }

        // Call control — only when not typing
        if (!inText) {
            if (e.key === 'a' || e.key === 'A') { if (opts.hasIncomingCall) { e.preventDefault(); opts.answerCall(); } return; }
            if (e.key === 'r' || e.key === 'R') { if (opts.hasIncomingCall) { e.preventDefault(); opts.rejectCall(); } return; }
            if (e.key === 'e' || e.key === 'E') { if (opts.hasActiveCall) { e.preventDefault(); opts.endCall(); } return; }
        }

        // ── Step-specific ─────────────────────────────────────────────────
        // ── Dialpad tab ──
        if (opts.callTab === 'dialpad' && !inText) {
            // Digits & special chars go to dialpad
            const DIALKEYS = '0123456789*#';
            if (DIALKEYS.includes(e.key)) { e.preventDefault(); opts.dialKey(e.key); return; }
            if (e.key === 'Backspace') { e.preventDefault(); opts.dialBackspace(); return; }
            if (e.key === 'Enter') { e.preventDefault(); opts.handleDial(); return; }

            // Esc clears the dial number first; if already empty, jump to status tab
            if (e.key === 'Escape') {
                e.preventDefault();
                if (opts.dialNumber.length > 0) { opts.clearDialNumber(); }
                else { opts.setCallTab('status'); }
                return;
            }
            // 1/2/3 without Ctrl: type digits (already handled above)
            return; // swallow everything else while dialpad focused
        }

        // ── Status / History tabs — 1/2/3 switch tabs ──
        if (!inText) {
            if (e.key === '1') { e.preventDefault(); opts.setCallTab('status'); return; }
            if (e.key === '2') { e.preventDefault(); opts.setCallTab('dialpad'); return; }
            if (e.key === '3') { e.preventDefault(); opts.setCallTab('history'); return; }
        }

        // ── History tab — arrow keys + Enter to redial ──
        if (opts.callTab === 'history' && !inText) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                opts.setSelectedHistoryIdx((prev) => Math.min(prev + 1, opts.historyLength - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                opts.setSelectedHistoryIdx((prev) => Math.max(prev - 1, 0));
                return;
            }
            if (e.key === 'Enter' && opts.selectedHistoryIdx >= 0) {
                e.preventDefault();
                opts.redialByIdx(opts.selectedHistoryIdx);
                return;
            }
            if (e.key === 'Escape') { e.preventDefault(); opts.closeDetailPanel(); return; }
        }

        // ── Status tab — Esc closes panels ──
        if (opts.callTab === 'status' && e.key === 'Escape') {
            e.preventDefault(); opts.closeDetailPanel(); return;
        }

        // ── Customer Search Navigation ──
        if (opts.customerResultsLength > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                opts.setSelectedCustomerIdx((prev) => Math.min(prev + 1, opts.customerResultsLength - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                opts.setSelectedCustomerIdx((prev) => Math.max(prev - 1, 0));
                return;
            }
            if (e.key === 'Enter' && opts.selectedCustomerIdx >= 0) {
                e.preventDefault();
                opts.enterCustomer();
                return;
            }
            if (e.key === 'Escape') { e.preventDefault(); opts.closeDetailPanel(); return; }
        }

    }, [opts]);

    useEffect(() => {
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handler]);
}
