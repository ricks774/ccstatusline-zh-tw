import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import type { RenderContext } from '../../types';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import type { StatusJSON } from '../../types/StatusJSON';
import type { WidgetItem } from '../../types/Widget';
import { getWidget } from '../../utils/widgets';
import { CacheIfColdWidget } from '../CacheIfCold';
import { CacheMissTokensWidget } from '../CacheMissTokens';
import { CacheMissesWidget } from '../CacheMisses';
import { LastCacheMissWidget } from '../LastCacheMiss';

type PromptCache = NonNullable<StatusJSON['prompt_cache']>;

// Three minutes after the docs' example miss
const NOW_SECONDS = 1738425410;

// The docs' example session: 2 misses in 14 requests, the last from 2 added tools
const DOCS_EXAMPLE: PromptCache = {
    warm: true,
    caching_observed: true,
    ttl: '1h',
    expires_at: 1738429200,
    requests: 14,
    misses: 2,
    expected_rebuilds: 1,
    hit_ratio: 0.91,
    cache_write_tokens: 352000,
    miss_recache_tokens: 310200,
    last_miss_at: 1738425230,
    last_miss_cause: { causes: ['tools_changed'], tools_added: 2, tools_removed: 0 },
    miss_causes: { tools_changed: 2 },
    recache_tokens_if_cold: 45000
};

const NO_MISSES: PromptCache = {
    requests: 6,
    misses: 0,
    miss_recache_tokens: 0,
    last_miss_at: null,
    last_miss_cause: null,
    recache_tokens_if_cold: 30000
};

const item = (type: string, extra: Partial<WidgetItem> = {}): WidgetItem => ({ id: type, type, ...extra });
const hideZero = (type: string): WidgetItem => item(type, { metadata: { hide: 'zero' } });
const withCache = (promptCache: PromptCache): RenderContext => ({ data: { prompt_cache: promptCache } });
const PREVIEW: RenderContext = { isPreview: true };
const NO_CACHE: RenderContext = { data: {} };

describe('Prompt cache widgets', () => {
    beforeEach(() => {
        vi.spyOn(Date, 'now').mockReturnValue(NOW_SECONDS * 1000);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('describes each widget in the Cache category', () => {
        const widgets = [new CacheMissesWidget(), new LastCacheMissWidget(), new CacheMissTokensWidget(), new CacheIfColdWidget()];

        expect(widgets.map(widget => widget.getDisplayName())).toEqual(['快取未命中', '上次快取未命中', '快取未命中 Token', '快取過期預估']);
        expect(widgets.map(widget => widget.getLabelPrefix())).toEqual(['未命中: ', '上次未命中: ', '未命中重建: ', '若過期: ']);
        for (const widget of widgets) {
            expect(widget.getCategory()).toBe('快取');
            expect(widget.supportsRawValue()).toBe(true);
        }
    });

    it('registers each widget under its type', () => {
        expect(getWidget('cache-misses')).toBeInstanceOf(CacheMissesWidget);
        expect(getWidget('last-cache-miss')).toBeInstanceOf(LastCacheMissWidget);
        expect(getWidget('cache-miss-tokens')).toBeInstanceOf(CacheMissTokensWidget);
        expect(getWidget('cache-if-cold')).toBeInstanceOf(CacheIfColdWidget);
    });

    describe('Cache Misses', () => {
        const widget = new CacheMissesWidget();
        const render = (widgetItem: WidgetItem, context: RenderContext) => widget.render(widgetItem, context, DEFAULT_SETTINGS);

        it('shows the misses out of the session\'s requests', () => {
            expect(render(item('cache-misses'), withCache(DOCS_EXAMPLE))).toBe('未命中: 2/14');
            expect(render(item('cache-misses', { rawValue: true }), withCache(DOCS_EXAMPLE))).toBe('2/14');
        });

        it('shows zero misses unless hidden', () => {
            expect(render(item('cache-misses'), withCache(NO_MISSES))).toBe('未命中: 0/6');
            expect(render(hideZero('cache-misses'), withCache(NO_MISSES))).toBeNull();
            expect(render(hideZero('cache-misses'), withCache(DOCS_EXAMPLE))).toBe('未命中: 2/14');
        });

        it('shows the count alone when the request count is missing', () => {
            expect(render(item('cache-misses'), withCache({ misses: 2 }))).toBe('未命中: 2');
        });

        it('renders nothing without a miss count', () => {
            expect(render(item('cache-misses'), NO_CACHE)).toBeNull();
            expect(render(item('cache-misses'), withCache({ requests: 14 }))).toBeNull();
        });

        it('previews the docs\' example', () => {
            expect(render(item('cache-misses'), PREVIEW)).toBe('未命中: 2/14');
        });

        it('can hide while the session has no misses', () => {
            expect(widget.getHideableStates()).toEqual([{ key: 'zero', label: '無未命中時' }]);
        });
    });

    describe('Last Cache Miss', () => {
        const widget = new LastCacheMissWidget();
        const render = (widgetItem: WidgetItem, context: RenderContext) => widget.render(widgetItem, context, DEFAULT_SETTINGS);

        it('shows how long ago the last miss was and its likely cause', () => {
            expect(render(item('last-cache-miss'), withCache(DOCS_EXAMPLE))).toBe('上次未命中: 3分前, 工具變更 (+2)');
            expect(render(item('last-cache-miss', { rawValue: true }), withCache(DOCS_EXAMPLE))).toBe('3分前, 工具變更 (+2)');
        });

        it('lists several causes', () => {
            const cache = { ...DOCS_EXAMPLE, last_miss_cause: { causes: ['system_prompt_changed', 'ttl_expired_5m'], system_char_delta: 120 } };

            expect(render(item('last-cache-miss'), withCache(cache))).toBe('上次未命中: 3分前, 系統提示詞變更 (+120 字元), 5m TTL 已過期');
        });

        it('says the cause is unknown when Claude Code identified none', () => {
            expect(render(item('last-cache-miss'), withCache({ ...DOCS_EXAMPLE, last_miss_cause: null }))).toBe('上次未命中: 3分前, 原因不明');
        });

        it('renders nothing before the first miss', () => {
            expect(render(item('last-cache-miss'), withCache(NO_MISSES))).toBeNull();
            expect(render(item('last-cache-miss'), NO_CACHE)).toBeNull();
        });

        it('previews the docs\' example', () => {
            expect(render(item('last-cache-miss'), PREVIEW)).toBe('上次未命中: 3分前, 工具變更 (+2)');
        });
    });

    describe('Cache Miss Tokens', () => {
        const widget = new CacheMissTokensWidget();
        const render = (widgetItem: WidgetItem, context: RenderContext) => widget.render(widgetItem, context, DEFAULT_SETTINGS);

        it('shows the tokens the misses wrote back to the cache', () => {
            expect(render(item('cache-miss-tokens'), withCache(DOCS_EXAMPLE))).toBe('未命中重建: 310.2k');
            expect(render(item('cache-miss-tokens', { rawValue: true }), withCache(DOCS_EXAMPLE))).toBe('310.2k');
        });

        it('applies the token number format', () => {
            expect(render(item('cache-miss-tokens', { numberFormat: { style: 'whole' } }), withCache(DOCS_EXAMPLE))).toBe('未命中重建: 310k');
        });

        it('shows zero unless hidden while the session has no misses', () => {
            expect(render(item('cache-miss-tokens'), withCache(NO_MISSES))).toBe('未命中重建: 0');
            expect(render(hideZero('cache-miss-tokens'), withCache(NO_MISSES))).toBeNull();
            expect(widget.getHideableStates()).toEqual([{ key: 'zero', label: '無未命中時' }]);
        });

        it('renders nothing without the token count', () => {
            expect(render(item('cache-miss-tokens'), NO_CACHE)).toBeNull();
            expect(render(item('cache-miss-tokens'), withCache({ misses: 2 }))).toBeNull();
        });

        it('previews the docs\' example', () => {
            expect(render(item('cache-miss-tokens'), PREVIEW)).toBe('未命中重建: 310.2k');
        });
    });

    describe('Cache If Cold', () => {
        const widget = new CacheIfColdWidget();
        const render = (widgetItem: WidgetItem, context: RenderContext) => widget.render(widgetItem, context, DEFAULT_SETTINGS);

        it('shows what the next request re-caches if the cache has gone cold', () => {
            expect(render(item('cache-if-cold'), withCache(DOCS_EXAMPLE))).toBe('若過期: 45.0k');
            expect(render(item('cache-if-cold', { rawValue: true }), withCache(DOCS_EXAMPLE))).toBe('45.0k');
            expect(render(item('cache-if-cold', { numberFormat: { style: 'whole' } }), withCache(DOCS_EXAMPLE))).toBe('若過期: 45k');
        });

        // Null right after a compaction, until the next request
        it('renders nothing while Claude Code has no figure', () => {
            expect(render(item('cache-if-cold'), withCache({ ...DOCS_EXAMPLE, recache_tokens_if_cold: null }))).toBeNull();
            expect(render(item('cache-if-cold'), NO_CACHE)).toBeNull();
        });

        it('previews the docs\' example', () => {
            expect(render(item('cache-if-cold'), PREVIEW)).toBe('若過期: 45.0k');
        });
    });
});
