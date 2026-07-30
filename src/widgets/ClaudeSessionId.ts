import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

export class ClaudeSessionIdWidget implements Widget {
    getDefaultColor(): string { return 'cyan'; }
    getDescription(): string { return '顯示狀態 JSON 中的當前 Claude Code 會話 ID'; }
    getDisplayName(): string { return 'Claude 會話 ID'; }
    getCategory(): string { return '核心'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? 'preview-session-id' : '會話 ID: preview-session-id';
        } else {
            const sessionId = context.data?.session_id;
            if (!sessionId) {
                return null;
            }
            return item.rawValue ? sessionId : `會話 ID: ${sessionId}`;
        }
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
