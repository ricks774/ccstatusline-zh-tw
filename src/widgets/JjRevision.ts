import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    isInsideJjRepo,
    runJjArgs
} from '../utils/jj';

export class JjRevisionWidget implements Widget {
    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return '顯示當前 Jujutsu 變更 ID（短）'; }
    getDisplayName(): string { return 'JJ 修訂'; }
    getCategory(): string { return 'Jujutsu'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const hideNoJj = item.metadata?.hideNoJj === 'true';
        const modifiers: string[] = [];

        if (hideNoJj) {
            modifiers.push('隱藏「無 JJ」');
        }

        return {
            displayText: this.getDisplayName(),
            modifierText: modifiers.length > 0 ? `(${modifiers.join(', ')})` : undefined
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        if (action === 'toggle-nojj') {
            const currentState = item.metadata?.hideNoJj === 'true';
            return {
                ...item,
                metadata: {
                    ...item.metadata,
                    hideNoJj: (!currentState).toString()
                }
            };
        }
        return null;
    }

    render(item: WidgetItem, context: RenderContext, _settings: Settings): string | null {
        const hideNoJj = item.metadata?.hideNoJj === 'true';

        if (context.isPreview) {
            return item.rawValue ? 'kkmpptxz' : ' kkmpptxz';
        }

        if (!isInsideJjRepo(context)) {
            return hideNoJj ? null : ' no jj';
        }

        const changeId = this.getJjRevision(context);
        if (changeId) {
            return item.rawValue ? changeId : ` ${changeId}`;
        }

        return hideNoJj ? null : ' no jj';
    }

    private getJjRevision(context: RenderContext): string | null {
        return runJjArgs([
            'log',
            '--no-graph',
            '-r',
            '@',
            '-T',
            'change_id.shortest()'
        ], context);
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'h', label: '(h)隱藏「無 JJ」提示', action: 'toggle-nojj' }
        ];
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(): boolean { return true; }
}
