import { GitFileCountWidget } from './shared/git-count-widget';

export class GitUntrackedFilesWidget extends GitFileCountWidget {
    protected readonly field = 'untracked';
    protected readonly label = '?:';
    protected readonly zeroLabel = '未跟蹤檔案數為零時';
    protected readonly previewCounts = 1;

    getDefaultColor(): string { return 'red'; }
    getDescription(): string { return '顯示未跟蹤檔案數'; }
    getDisplayName(): string { return 'Git 未跟蹤檔案'; }
}
