import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getTerminalWidth } from '../utils/terminal';

export class TerminalWidthWidget implements Widget {
    getDefaultColor(): string { return 'gray'; }
    getDescription(): string { return '顯示當前終端寬度（列數）'; }
    getDisplayName(): string { return '終端寬度'; }
    getCategory(): string { return '環境'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const width = context.terminalWidth ?? getTerminalWidth();
        if (context.isPreview) {
            const detectedWidth = width ?? '??';
            return item.rawValue ? `${detectedWidth}` : `終端: ${detectedWidth}`;
        } else if (width) {
            return item.rawValue ? `${width}` : `終端: ${width}`;
        }
        return null;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
