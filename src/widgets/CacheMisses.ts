import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    HideableState,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

import { isHidden } from './shared/hideable';
import {
    NO_MISSES_HIDEABLE_STATE,
    getPromptCache,
    hasNoMisses
} from './shared/prompt-cache';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

const LABEL = '未命中: ';

export class CacheMissesWidget implements Widget {
    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return '顯示本會話請求中提示詞快取的未命中次數（依 Claude Code 回報）'; }
    getDisplayName(): string { return '快取未命中'; }
    getCategory(): string { return '快取'; }
    getLabelPrefix(): string { return LABEL; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    getHideableStates(): HideableState[] {
        return [NO_MISSES_HIDEABLE_STATE];
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const cache = getPromptCache(context);
        if (typeof cache?.misses !== 'number') {
            return null;
        }

        if (hasNoMisses(cache) && isHidden(item, NO_MISSES_HIDEABLE_STATE.key)) {
            return null;
        }

        const value = typeof cache.requests === 'number' ? `${cache.misses}/${cache.requests}` : `${cache.misses}`;
        return formatRawOrLabeledValue(item, LABEL, value);
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
