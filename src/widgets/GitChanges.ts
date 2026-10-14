import type { WidgetItem } from '../types/Widget';
import type { GitChangeCounts } from '../utils/git';

import { GitLineCountWidget } from './shared/git-count-widget';
import {
    getSlotSymbol,
    type SymbolSlot
} from './shared/symbol-override';

const INSERTIONS_SLOT: SymbolSlot = { id: 'symbolInsertions', label: '新增', defaultSymbol: '+' };
const DELETIONS_SLOT: SymbolSlot = { id: 'symbolDeletions', label: '刪除', defaultSymbol: '-' };

export class GitChangesWidget extends GitLineCountWidget {
    protected readonly zeroLabel = '沒有變更時';
    protected readonly slots = [INSERTIONS_SLOT, DELETIONS_SLOT];

    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return '顯示 Git 變更數（+新增, -刪除）'; }
    getDisplayName(): string { return 'Git 變更'; }

    protected isZero(changes: GitChangeCounts): boolean {
        return changes.insertions === 0 && changes.deletions === 0;
    }

    protected formatCounts(item: WidgetItem, changes: GitChangeCounts): string {
        return `(${getSlotSymbol(item, INSERTIONS_SLOT)}${changes.insertions},${getSlotSymbol(item, DELETIONS_SLOT)}${changes.deletions})`;
    }
}
