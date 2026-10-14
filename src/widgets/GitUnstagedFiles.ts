import { GitFileCountWidget } from './shared/git-count-widget';

export class GitUnstagedFilesWidget extends GitFileCountWidget {
    protected readonly field = 'unstaged';
    protected readonly label = 'M:';
    protected readonly zeroLabel = '未暫存檔案數為零時';
    protected readonly previewCounts = 2;

    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return '顯示未暫存檔案數'; }
    getDisplayName(): string { return 'Git 未暫存檔案'; }
}
