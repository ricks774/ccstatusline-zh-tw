import type { RemoteInfo } from '../utils/git-remote';

import { GitRemoteWidgetBase } from './shared/git-remote-widget-base';

export class GitUpstreamRepoWidget extends GitRemoteWidgetBase {
    protected readonly remote = 'upstream';
    protected readonly previewText = 'upstream-repo';
    protected readonly previewUrl = 'https://github.com/upstream-owner/upstream-repo';

    getDefaultColor(): string { return 'magenta'; }
    getDescription(): string { return '顯示 upstream 遠端的倉庫名'; }
    getDisplayName(): string { return 'Git Upstream 倉庫'; }

    protected formatRemote(remote: RemoteInfo): string {
        return remote.repo;
    }
}
