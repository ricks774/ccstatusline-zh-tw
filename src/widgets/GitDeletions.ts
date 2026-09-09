import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    HideableState,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    getGitChangeCounts,
    isInsideGitWorkTree
} from '../utils/git';

import {
    NO_GIT_HIDEABLE_STATE,
    isHidden
} from './shared/hideable';

const ZERO_HIDEABLE_STATE: HideableState = { key: 'zero', label: '刪除行數為零時' };

export class GitDeletionsWidget implements Widget {
    getDefaultColor(): string { return 'red'; }
    getDescription(): string { return '顯示 Git 刪除行數'; }
    getDisplayName(): string { return 'Git 刪除'; }
    getCategory(): string { return 'Git'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    getHideableStates(): HideableState[] {
        return [NO_GIT_HIDEABLE_STATE, ZERO_HIDEABLE_STATE];
    }

    render(item: WidgetItem, context: RenderContext, _settings: Settings): string | null {
        const hideNoGit = isHidden(item, NO_GIT_HIDEABLE_STATE.key);

        if (context.isPreview) {
            return '-10';
        }

        if (!isInsideGitWorkTree(context)) {
            return hideNoGit ? null : '(無 Git)';
        }

        const changes = getGitChangeCounts(context);
        if (changes.deletions === 0 && isHidden(item, ZERO_HIDEABLE_STATE.key)) {
            return null;
        }

        return `-${changes.deletions}`;
    }

    supportsRawValue(): boolean { return false; }
    supportsColors(item: WidgetItem): boolean { return true; }
}
