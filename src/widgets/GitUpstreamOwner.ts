import type { RemoteInfo } from '../utils/git-remote';

import { GitRemoteWidgetBase } from './shared/git-remote-widget-base';

export class GitUpstreamOwnerWidget extends GitRemoteWidgetBase {
    protected readonly remote = 'upstream';
    protected readonly previewText = 'upstream-owner';
    protected readonly previewUrl = 'https://github.com/upstream-owner/repo';

    getDefaultColor(): string { return 'magenta'; }
    getDescription(): string { return '顯示 upstream 遠端的所有者/組織'; }
    getDisplayName(): string { return 'Git Upstream 所有者'; }

    protected formatRemote(remote: RemoteInfo): string {
        return remote.owner;
    }
}
