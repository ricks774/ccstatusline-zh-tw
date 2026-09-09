import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowSize } from '../utils/context-window';
import {
    getContextConfig,
    getModelContextIdentifier
} from '../utils/model-context';
import { resolveNumberFormat } from '../utils/number-format';
import { formatTokens } from '../utils/renderer';

export class ContextWindowWidget implements Widget {
    getDefaultColor(): string { return 'brightBlack'; }
    getDescription(): string { return '顯示當前模型的上下文視窗總大小'; }
    getDisplayName(): string { return '上下文視窗'; }
    getCategory(): string { return '上下文'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const format = resolveNumberFormat('token', item, settings);
        if (context.isPreview) {
            const value = formatTokens(200000, format);
            return item.rawValue ? value : `視窗: ${value}`;
        }

        let total = getContextWindowSize(context.data);

        if (total === null) {
            const modelIdentifier = getModelContextIdentifier(context.data?.model);
            total = getContextConfig(modelIdentifier).maxTokens;
        }

        if (total <= 0) {
            return null;
        }

        return item.rawValue ? formatTokens(total, format) : `視窗: ${formatTokens(total, format)}`;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
    supportsNumberFormat(): boolean { return true; }
}
