import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

import {
    getCacheHitRate,
    getCacheTokens
} from './shared/cache-metrics';
import {
    getCacheKeybinds,
    getCacheModifierText,
    handleCacheOptionsAction,
    isCacheHideWhenEmptyEnabled,
    isCacheSessionScope
} from './shared/cache-scope';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class CacheHitRateWidget implements Widget {
    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return '顯示提示快取命中率（快取讀取 vs 快取寫入）'; }
    getDisplayName(): string { return '快取命中率'; }
    getCategory(): string { return '快取'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName(), modifierText: getCacheModifierText(item) };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        return handleCacheOptionsAction(action, item);
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, '快取命中: ', '87.0%');
        }

        const hideWhenEmpty = isCacheHideWhenEmptyEnabled(item);
        const tokens = getCacheTokens(context, isCacheSessionScope(item));
        if (!tokens) {
            return hideWhenEmpty ? null : formatRawOrLabeledValue(item, '快取命中: ', 'n/a');
        }

        const hitRate = getCacheHitRate(tokens);
        if (hitRate === null) {
            return hideWhenEmpty ? null : formatRawOrLabeledValue(item, '快取命中: ', '0.0%');
        }

        if (hitRate === 0 && hideWhenEmpty) {
            return null;
        }

        return formatRawOrLabeledValue(item, '快取命中: ', `${hitRate.toFixed(1)}%`);
    }

    getCustomKeybinds(item?: WidgetItem): CustomKeybind[] {
        return getCacheKeybinds();
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
