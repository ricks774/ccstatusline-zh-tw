import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

export class OutputStyleWidget implements Widget {
    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return '顯示當前 Claude Code 輸出風格'; }
    getDisplayName(): string { return '輸出風格'; }
    getCategory(): string { return '核心'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? 'default' : '風格: default';
        } else if (context.data?.output_style?.name) {
            return item.rawValue ? context.data.output_style.name : `風格: ${context.data.output_style.name}`;
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
