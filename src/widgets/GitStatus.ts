import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetEditorProps,
    WidgetItem
} from '../types/Widget';
import {
    getGitStatus,
    isInsideGitWorkTree
} from '../utils/git';

import { makeModifierText } from './shared/editor-display';
import {
    getHideNoGitKeybinds,
    getHideNoGitModifierText,
    handleToggleNoGitAction,
    isHideNoGitEnabled
} from './shared/git-no-git';
import {
    getSlotSymbol,
    getSymbolKeybind,
    renderSymbolSlotsEditor,
    type SymbolSlot
} from './shared/symbol-override';

const CONFLICTS_SLOT: SymbolSlot = { id: 'symbolConflicts', label: '衝突', defaultSymbol: '!' };
const STAGED_SLOT: SymbolSlot = { id: 'symbolStaged', label: '已暫存', defaultSymbol: '+' };
const UNSTAGED_SLOT: SymbolSlot = { id: 'symbolUnstaged', label: '未暫存', defaultSymbol: '*' };
const UNTRACKED_SLOT: SymbolSlot = { id: 'symbolUntracked', label: '未追蹤', defaultSymbol: '?' };

export class GitStatusWidget implements Widget {
    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return '顯示 Git 狀態指示：+ 已暫存, * 未暫存, ? 未跟蹤, ! 衝突'; }
    getDisplayName(): string { return 'Git 狀態'; }
    getCategory(): string { return 'Git'; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const modifiers: string[] = [];
        const noGitText = getHideNoGitModifierText(item);
        if (noGitText)
            modifiers.push('隱藏「無 Git」');

        return {
            displayText: this.getDisplayName(),
            modifierText: makeModifierText(modifiers)
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        return handleToggleNoGitAction(action, item);
    }

    render(item: WidgetItem, context: RenderContext, _settings: Settings): string | null {
        const hideNoGit = isHideNoGitEnabled(item);

        if (context.isPreview) {
            return this.formatStatus(item, { staged: true, unstaged: true, untracked: false, conflicts: false });
        }

        if (!isInsideGitWorkTree(context)) {
            return hideNoGit ? null : '（無 Git）';
        }

        const status = getGitStatus(context);

        // Hide if clean
        if (!status.staged && !status.unstaged && !status.untracked && !status.conflicts) {
            return null;
        }

        return this.formatStatus(item, status);
    }

    private formatStatus(item: WidgetItem, status: { staged: boolean; unstaged: boolean; untracked: boolean; conflicts: boolean }): string {
        const parts: string[] = [];
        if (status.conflicts)
            parts.push(getSlotSymbol(item, CONFLICTS_SLOT));
        if (status.staged)
            parts.push(getSlotSymbol(item, STAGED_SLOT));
        if (status.unstaged)
            parts.push(getSlotSymbol(item, UNSTAGED_SLOT));
        if (status.untracked)
            parts.push(getSlotSymbol(item, UNTRACKED_SLOT));

        return parts.join('');
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            ...getHideNoGitKeybinds(),
            getSymbolKeybind()
        ];
    }

    renderEditor(props: WidgetEditorProps) {
        return renderSymbolSlotsEditor(props, [CONFLICTS_SLOT, STAGED_SLOT, UNSTAGED_SLOT, UNTRACKED_SLOT]);
    }

    supportsRawValue(): boolean { return false; }
    supportsColors(_item: WidgetItem): boolean { return true; }
}
