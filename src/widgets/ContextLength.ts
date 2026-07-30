import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowContextLengthTokens } from '../utils/context-window';
import { formatTokens } from '../utils/renderer';

export class ContextLengthWidget implements Widget {
    getDefaultColor(): string { return 'brightBlack'; }
    getDescription(): string { return '顯示當前上下文視窗大小（Token 數）'; }
    getDisplayName(): string { return '上下文長度'; }
    getCategory(): string { return '上下文'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? '18.6k' : '上下文: 18.6k';
        }

        const contextLengthTokens = getContextWindowContextLengthTokens(context.data);
        if (contextLengthTokens !== null) {
            return item.rawValue ? formatTokens(contextLengthTokens) : `上下文: ${formatTokens(contextLengthTokens)}`;
        }

        if (context.tokenMetrics) {
            return item.rawValue ? formatTokens(context.tokenMetrics.contextLength) : `上下文: ${formatTokens(context.tokenMetrics.contextLength)}`;
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
