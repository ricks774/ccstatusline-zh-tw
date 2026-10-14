import type { WidgetItem } from '../types/Widget';
import type { GitChangeCounts } from '../utils/git';

import { GitLineCountWidget } from './shared/git-count-widget';
import {
    getSlotSymbol,
    type SymbolSlot
} from './shared/symbol-override';

const DELETIONS_SLOT: SymbolSlot = { id: 'symbolDeletions', label: '刪除', defaultSymbol: '-' };

export class GitDeletionsWidget extends GitLineCountWidget {
    protected readonly zeroLabel = '刪除行數為零時';
    protected readonly slots = [DELETIONS_SLOT];

    getDefaultColor(): string { return 'red'; }
    getDescription(): string { return '顯示 Git 刪除行數'; }
    getDisplayName(): string { return 'Git 刪除'; }

    protected isZero(changes: GitChangeCounts): boolean {
        return changes.deletions === 0;
    }

    protected formatCounts(item: WidgetItem, changes: GitChangeCounts): string {
        return `${getSlotSymbol(item, DELETIONS_SLOT)}${changes.deletions}`;
    }
}
