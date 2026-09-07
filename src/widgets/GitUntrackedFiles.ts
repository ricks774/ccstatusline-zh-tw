import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    HideableState,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import {
    getGitFileStatusCounts,
    isInsideGitWorkTree
} from '../utils/git';

import {
    NO_GIT_HIDEABLE_STATE,
    isHidden
} from './shared/hideable';

const ZERO_HIDEABLE_STATE: HideableState = { key: 'zero', label: '未追蹤檔案數為零時' };

export class GitUntrackedFilesWidget implements Widget {
    getDefaultColor(): string { return 'red'; }
    getDescription(): string { return '顯示未跟蹤檔案數'; }
    getDisplayName(): string { return 'Git 未跟蹤檔案'; }
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
            return item.rawValue ? '1' : '?:1';
        }

        if (!isInsideGitWorkTree(context)) {
            return hideNoGit ? null : '(no git)';
        }

        const counts = getGitFileStatusCounts(context);
        if (counts.untracked === 0 && isHidden(item, ZERO_HIDEABLE_STATE.key)) {
            return null;
        }

        return item.rawValue ? `${counts.untracked}` : `?:${counts.untracked}`;
    }

    getNumericValue(context: RenderContext, _item: WidgetItem): number | null {
        if (!isInsideGitWorkTree(context))
            return null;
        return getGitFileStatusCounts(context).untracked;
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(_item: WidgetItem): boolean { return true; }
}
