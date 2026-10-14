import { GitFileCountWidget } from './shared/git-count-widget';

export class GitStagedFilesWidget extends GitFileCountWidget {
    protected readonly field = 'staged';
    protected readonly label = 'S:';
    protected readonly zeroLabel = '已暫存檔案數為零時';
    protected readonly previewCounts = 3;

    getDefaultColor(): string { return 'green'; }
    getDescription(): string { return '顯示已暫存檔案數'; }
    getDisplayName(): string { return 'Git 已暫存檔案'; }
}
