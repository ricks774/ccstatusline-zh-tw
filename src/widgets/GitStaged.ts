import { GitStatusFlagWidget } from './shared/git-status-widget';

export class GitStagedWidget extends GitStatusFlagWidget {
    protected readonly flag = 'staged';
    protected readonly defaultSymbol = '+';

    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return '存在已暫存變更時顯示 +'; }
    getDisplayName(): string { return 'Git 已暫存'; }
}
