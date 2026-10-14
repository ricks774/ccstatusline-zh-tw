import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowContextLengthTokens } from '../utils/context-window';
import { resolveNumberFormat } from '../utils/number-format';
import { formatTokens } from '../utils/renderer';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';

const LABEL = '上下文: ';

export class ContextLengthWidget implements Widget {
    getDefaultColor(): string { return 'brightBlack'; }
    getDescription(): string { return '顯示當前上下文視窗大小（Token 數）'; }
    getDisplayName(): string { return '上下文長度'; }
    getCategory(): string { return '上下文'; }
    getLabelPrefix(): string { return LABEL; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const format = resolveNumberFormat('token', item, settings);
        if (context.isPreview) {
            const value = formatTokens(18600, format);
            return formatRawOrLabeledValue(item, this.getLabelPrefix(), value);
        }

        const contextLengthTokens = getContextWindowContextLengthTokens(context.data);
        if (contextLengthTokens !== null) {
            return formatRawOrLabeledValue(item, this.getLabelPrefix(), formatTokens(contextLengthTokens, format));
        }

        if (context.tokenMetrics) {
            return formatRawOrLabeledValue(item, this.getLabelPrefix(), formatTokens(context.tokenMetrics.contextLength, format));
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
    supportsNumberFormat(): boolean { return true; }
}
