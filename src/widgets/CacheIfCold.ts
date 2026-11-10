import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { formatTokens } from '../utils/format-tokens';
import { resolveNumberFormat } from '../utils/number-format';

import { getPromptCache } from './shared/prompt-cache';
import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

const LABEL = '若過期: ';

// Claude Code leaves the figure null right after a compaction or a clearing of
// old tool results, until the next request records the conversation's new size
export class CacheIfColdWidget implements Widget {
    getDefaultColor(): string { return 'brightCyan'; }
    getDescription(): string { return '顯示若提示詞快取屆時已過期，下一次請求需要重新快取的 Token 數'; }
    getDisplayName(): string { return '快取過期預估'; }
    getCategory(): string { return '快取'; }
    getLabelPrefix(): string { return LABEL; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const tokens = getPromptCache(context)?.recache_tokens_if_cold;
        if (typeof tokens !== 'number') {
            return null;
        }

        return formatRawOrLabeledValue(item, LABEL, formatTokens(tokens, resolveNumberFormat('token', item, settings)));
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
    supportsNumberFormat(): boolean { return true; }
}
