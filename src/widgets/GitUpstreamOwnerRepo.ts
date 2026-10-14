import type { RemoteInfo } from '../utils/git-remote';

import { GitRemoteWidgetBase } from './shared/git-remote-widget-base';

export class GitUpstreamOwnerRepoWidget extends GitRemoteWidgetBase {
    protected readonly remote = 'upstream';
    protected readonly previewText = 'upstream-owner/upstream-repo';
    protected readonly previewUrl = 'https://github.com/upstream-owner/upstream-repo';

    getDefaultColor(): string { return 'magenta'; }
    getDescription(): string { return '以 所有者/倉庫 形式顯示 upstream 遠端'; }
    getDisplayName(): string { return 'Git Upstream 所有者/倉庫'; }

    protected formatRemote(remote: RemoteInfo): string {
        return `${remote.owner}/${remote.repo}`;
    }
}
