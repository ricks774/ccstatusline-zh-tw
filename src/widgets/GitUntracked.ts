import { GitStatusFlagWidget } from './shared/git-status-widget';

export class GitUntrackedWidget extends GitStatusFlagWidget {
    protected readonly flag = 'untracked';
    protected readonly defaultSymbol = '?';

    getDefaultColor(): string { return 'red'; }
    getDescription(): string { return '存在未跟蹤檔案時顯示 ?'; }
    getDisplayName(): string { return 'Git 未跟蹤'; }
}
