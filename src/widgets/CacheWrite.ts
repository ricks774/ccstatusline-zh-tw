import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

import {
    formatTokensWithPercentage,
    getCacheTokens,
    getCacheWritePercentage
} from './shared/cache-metrics';
import {
    getCacheKeybinds,
    getCacheModifierText,
    handleCacheOptionsAction,
    isCacheHideWhenEmptyEnabled,
    isCacheSessionScope
} from './shared/cache-scope';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

export class CacheWriteWidget implements Widget {
    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return '顯示寫入快取的快取寫入令牌數及其上下文佔比'; }
    getDisplayName(): string { return '快取寫入'; }
    getCategory(): string { return '快取'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName(), modifierText: getCacheModifierText(item) };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        return handleCacheOptionsAction(action, item);
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return formatRawOrLabeledValue(item, '快取寫入: ', '3k (16.0%)');
        }

        const hideWhenEmpty = isCacheHideWhenEmptyEnabled(item);
        const tokens = getCacheTokens(context, isCacheSessionScope(item));
        if (!tokens) {
            return hideWhenEmpty ? null : formatRawOrLabeledValue(item, '快取寫入: ', 'n/a');
        }

        if (tokens.creation === 0 && hideWhenEmpty) {
            return null;
        }

        const value = formatTokensWithPercentage(tokens.creation, getCacheWritePercentage(tokens));
        return formatRawOrLabeledValue(item, '快取寫入: ', value);
    }

    getCustomKeybinds(item?: WidgetItem): CustomKeybind[] {
        return getCacheKeybinds();
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
