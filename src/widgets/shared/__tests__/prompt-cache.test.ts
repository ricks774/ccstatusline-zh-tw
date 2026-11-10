import {
    describe,
    expect,
    it
} from 'vitest';

import {
    formatMissAge,
    formatMissCause,
    getPromptCache
} from '../prompt-cache';

describe('formatMissCause', () => {
    it('names changed tools with how many were added and removed, leaving out zeros', () => {
        expect(formatMissCause({ causes: ['tools_changed'], tools_added: 2, tools_removed: 0 })).toBe('工具變更 (+2)');
        expect(formatMissCause({ causes: ['tools_changed'], tools_added: 0, tools_removed: 3 })).toBe('工具變更 (−3)');
        expect(formatMissCause({ causes: ['tools_changed'], tools_added: 2, tools_removed: 1 })).toBe('工具變更 (+2, −1)');
        expect(formatMissCause({ causes: ['tools_changed'] })).toBe('工具變更');
    });

    it('gives the system prompt\'s change in length with its sign', () => {
        expect(formatMissCause({ causes: ['system_prompt_changed'], system_char_delta: 120 })).toBe('系統提示詞變更 (+120 字元)');
        expect(formatMissCause({ causes: ['system_prompt_changed'], system_char_delta: -45 })).toBe('系統提示詞變更 (−45 字元)');
        expect(formatMissCause({ causes: ['system_prompt_changed'], system_char_delta: 0 })).toBe('系統提示詞變更');
        expect(formatMissCause({ causes: ['system_prompt_changed'] })).toBe('系統提示詞變更');
    });

    it('names an expired TTL by its lifetime', () => {
        expect(formatMissCause({ causes: ['ttl_expired_5m'] })).toBe('5m TTL 已過期');
        expect(formatMissCause({ causes: ['ttl_expired_1h'] })).toBe('1h TTL 已過期');
    });

    it('reads the server-side cause and causes it doesn\'t know as words', () => {
        expect(formatMissCause({ causes: ['likely_server_side'] })).toBe('likely server side');
        expect(formatMissCause({ causes: ['model_switched'] })).toBe('model switched');
    });

    it('joins several causes', () => {
        expect(formatMissCause({ causes: ['tools_changed', 'ttl_expired_5m'], tools_added: 1 })).toBe('工具變更 (+1), 5m TTL 已過期');
    });

    it('says the cause is unknown when Claude Code identified none', () => {
        expect(formatMissCause(null)).toBe('原因不明');
        expect(formatMissCause(undefined)).toBe('原因不明');
        expect(formatMissCause({ causes: [] })).toBe('原因不明');
    });
});

describe('formatMissAge', () => {
    // Three minutes after a miss at 1738425230
    const nowMs = 1738425410 * 1000;

    it('gives the time since the miss compactly', () => {
        expect(formatMissAge(1738425230, nowMs)).toBe('3分前');
        expect(formatMissAge(1738425230 - 3600, nowMs)).toBe('1時3分前');
    });

    it('says just now within a minute, and for a miss stamped ahead of the clock', () => {
        expect(formatMissAge(1738425400, nowMs)).toBe('剛剛');
        expect(formatMissAge(1738425500, nowMs)).toBe('剛剛');
    });
});

describe('getPromptCache', () => {
    it('reads prompt_cache from the status line payload', () => {
        expect(getPromptCache({ data: { prompt_cache: { requests: 14, misses: 2 } } })).toEqual({ requests: 14, misses: 2 });
    });

    it('returns null before Claude Code reports one', () => {
        expect(getPromptCache({})).toBeNull();
        expect(getPromptCache({ data: {} })).toBeNull();
        expect(getPromptCache({ data: { prompt_cache: null } })).toBeNull();
    });
});
