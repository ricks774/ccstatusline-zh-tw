import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import type { RenderContext } from '../../types/RenderContext';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import type { WidgetItem } from '../../types/Widget';
import * as usage from '../../utils/usage';
import type { UsageWindowMetrics } from '../../utils/usage-types';
import { BlockTimerWidget } from '../BlockTimer';

import { runUsageTimerEditorSuite } from './helpers/usage-widget-suites';

function render(widget: BlockTimerWidget, item: WidgetItem, context: RenderContext = {}): string | null {
    return widget.render(item, context, DEFAULT_SETTINGS);
}

describe('BlockTimerWidget', () => {
    let mockFormatUsageDuration: { mockReturnValue: (value: string) => void };
    let mockResolveUsageWindowWithFallback: { mockReturnValue: (value: UsageWindowMetrics | null) => void };

    beforeEach(() => {
        vi.restoreAllMocks();
        mockFormatUsageDuration = vi.spyOn(usage, 'formatUsageDuration');
        mockResolveUsageWindowWithFallback = vi.spyOn(usage, 'resolveUsageWindowWithFallback');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders elapsed time in time mode', () => {
        const widget = new BlockTimerWidget();
        const item: WidgetItem = { id: 'block', type: 'block-timer' };

        mockResolveUsageWindowWithFallback.mockReturnValue({
            sessionDurationMs: 18000000,
            elapsedMs: 13500000,
            remainingMs: 4500000,
            elapsedPercent: 75,
            remainingPercent: 25
        });
        mockFormatUsageDuration.mockReturnValue('3時 45分');

        expect(render(widget, item, { usageData: {} })).toBe('時段: 3時 45分');
    });

    it('renders short progress bar with inverted fill', () => {
        const widget = new BlockTimerWidget();
        const item: WidgetItem = {
            id: 'block',
            type: 'block-timer',
            metadata: {
                display: 'progress-short',
                invert: 'true'
            }
        };

        mockResolveUsageWindowWithFallback.mockReturnValue({
            sessionDurationMs: 18000000,
            elapsedMs: 13500000,
            remainingMs: 4500000,
            elapsedPercent: 75,
            remainingPercent: 25
        });

        expect(render(widget, item, { usageData: {} })).toBe('時段 [████░░░░░░░░░░░░] 25.0%');
    });

    it('rounds the progress bar fill to the nearest cell', () => {
        const widget = new BlockTimerWidget();
        const item: WidgetItem = {
            id: 'block',
            type: 'block-timer',
            metadata: { display: 'progress' }
        };

        mockResolveUsageWindowWithFallback.mockReturnValue({
            sessionDurationMs: 18000000,
            elapsedMs: 13302000,
            remainingMs: 4698000,
            elapsedPercent: 73.9,
            remainingPercent: 26.1
        });

        // 73.9% of 32 cells is 23.648, past the half-cell mark, so the 24th cell fills.
        expect(render(widget, item, { usageData: {} })).toBe(`Block [${'█'.repeat(24)}${'░'.repeat(8)}] 73.9%`);
    });

    it('renders empty values when no usage or fallback data exists', () => {
        const widget = new BlockTimerWidget();

        mockResolveUsageWindowWithFallback.mockReturnValue(null);

        expect(render(widget, { id: 'block', type: 'block-timer' }, { usageData: { error: 'timeout' } })).toBe('時段: 0時 0分');
        expect(render(widget, {
            id: 'block',
            type: 'block-timer',
            metadata: { display: 'progress' }
        }, { usageData: { error: 'timeout' } })).toBe(`時段 [${'░'.repeat(32)}] 0.0%`);
    });

    it('hides empty values when the no-data hide state is enabled', () => {
        const widget = new BlockTimerWidget();

        mockResolveUsageWindowWithFallback.mockReturnValue(null);

        expect(widget.getHideableStates().map(state => state.key)).toEqual(['no-data']);
        expect(render(widget, {
            id: 'block',
            type: 'block-timer',
            metadata: { hide: 'no-data' }
        }, { usageData: { error: 'timeout' } })).toBeNull();
        expect(render(widget, {
            id: 'block',
            type: 'block-timer',
            metadata: { display: 'progress', hide: 'no-data' }
        }, { usageData: { error: 'timeout' } })).toBeNull();
    });

    it('shows raw value without label in time mode', () => {
        const widget = new BlockTimerWidget();

        mockResolveUsageWindowWithFallback.mockReturnValue({
            sessionDurationMs: 18000000,
            elapsedMs: 7200000,
            remainingMs: 10800000,
            elapsedPercent: 40,
            remainingPercent: 60
        });
        mockFormatUsageDuration.mockReturnValue('2hr');

        expect(render(widget, { id: 'block', type: 'block-timer', rawValue: true }, { usageData: {} })).toBe('2hr');
    });

    runUsageTimerEditorSuite({
        baseItem: { id: 'block', type: 'block-timer' },
        createWidget: () => new BlockTimerWidget(),
        expectedDisplayName: '時段計時器',
        expectedModifierText: '(長進度條, 反轉)',
        modifierItem: {
            id: 'block',
            type: 'block-timer',
            metadata: { display: 'progress', invert: 'true' }
        }
    });
});
