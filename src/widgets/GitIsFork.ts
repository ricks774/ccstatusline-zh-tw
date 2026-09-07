import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    HideableState,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getForkStatus } from '../utils/git-remote';

import { isHidden } from './shared/hideable';

const NOT_FORK_HIDEABLE_STATE: HideableState = { key: 'not-fork', label: '倉庫不是 Fork 時' };

export class GitIsForkWidget implements Widget {
    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return '當倉庫是 upstream 的 fork 時顯示標識'; }
    getDisplayName(): string { return 'Git 是否 Fork'; }
    getCategory(): string { return 'Git'; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    getHideableStates(): HideableState[] {
        return [NOT_FORK_HIDEABLE_STATE];
    }

    render(item: WidgetItem, context: RenderContext, _settings: Settings): string | null {
        if (context.isPreview) {
            return item.rawValue ? 'true' : 'isFork: true';
        }

        const forkStatus = getForkStatus(context);

        if (forkStatus.isFork) {
            return item.rawValue ? 'true' : 'isFork: true';
        }

        // Not a fork
        if (isHidden(item, NOT_FORK_HIDEABLE_STATE.key)) {
            return null;
        }

        return item.rawValue ? 'false' : 'isFork: false';
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(_item: WidgetItem): boolean { return true; }
}
