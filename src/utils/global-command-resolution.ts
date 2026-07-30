import { execFileSync } from 'child_process';
import * as path from 'path';

import {
    getPackageManagerExecutable,
    getPackageManagerShellOptions
} from './package-manager-executable';

export type GlobalPackageManager = 'npm' | 'bun';

interface ExecOptions { platform?: NodeJS.Platform }

export interface GlobalCommandResolution {
    resolvedPaths: string[];
    firstResolvedPath: string | null;
    expectedBinDir: string | null;
    warning: string | null;
}

const COMMAND_LOOKUP_TIMEOUT_MS = 5000;

function splitCommandOutput(output: string): string[] {
    const seen = new Set<string>();
    const paths: string[] = [];

    for (const line of output.split(/\r?\n/)) {
        const candidate = line.trim();
        if (!candidate || seen.has(candidate)) {
            continue;
        }

        seen.add(candidate);
        paths.push(candidate);
    }

    return paths;
}

function isTransientBunxStatusLinePath(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');

    return /(?:^|\/)bunx-[^/]*ccstatusline-zh-tw@[^/]+\/node_modules\/\.bin\/ccstatusline-zh-tw(?:\.(?:cmd|ps1))?$/i.test(normalized);
}

export function getPersistentCommandResolutionPaths(paths: string[]): string[] {
    return paths.filter(path => !isTransientBunxStatusLinePath(path));
}

export function getCommandResolutionPaths(
    command: string,
    { platform = process.platform }: ExecOptions = {}
): string[] {
    try {
        const output = platform === 'win32'
            ? execFileSync('where', [command], {
                encoding: 'utf-8',
                timeout: COMMAND_LOOKUP_TIMEOUT_MS,
                windowsHide: true,
                stdio: ['ignore', 'pipe', 'ignore']
            })
            : execFileSync('which', ['-a', command], {
                encoding: 'utf-8',
                timeout: COMMAND_LOOKUP_TIMEOUT_MS,
                windowsHide: true,
                stdio: ['ignore', 'pipe', 'ignore']
            });

        return splitCommandOutput(output);
    } catch {
        return [];
    }
}

function getNpmGlobalBinDir(platform: NodeJS.Platform): string | null {
    try {
        const executable = getPackageManagerExecutable('npm', platform);
        const prefix = execFileSync(executable, ['prefix', '-g'], {
            encoding: 'utf-8',
            timeout: COMMAND_LOOKUP_TIMEOUT_MS,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'ignore'],
            ...getPackageManagerShellOptions(executable, platform)
        }).trim();

        if (!prefix) {
            return null;
        }

        return platform === 'win32' || /^[a-z]:[\\/]/i.test(prefix)
            ? prefix
            : path.join(prefix, 'bin');
    } catch {
        return null;
    }
}

function getBunGlobalBinDir(): string | null {
    try {
        // bun 未初始化全域性目錄時會向 stderr 列印錯誤（issue #39），必須靜默
        const binDir = execFileSync('bun', ['pm', 'bin', '-g'], {
            encoding: 'utf-8',
            timeout: COMMAND_LOOKUP_TIMEOUT_MS,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'ignore']
        }).trim();

        return binDir || null;
    } catch {
        return null;
    }
}

export function getExpectedGlobalBinDir(
    packageManager: GlobalPackageManager,
    { platform = process.platform }: ExecOptions = {}
): string | null {
    return packageManager === 'npm'
        ? getNpmGlobalBinDir(platform)
        : getBunGlobalBinDir();
}

function trimTrailingSlashes(value: string): string {
    if (/^[a-z]:\/$/i.test(value) || value === '/') {
        return value;
    }

    return value.replace(/\/+$/, '');
}

function normalizePathForComparison(filePath: string): string {
    const normalized = trimTrailingSlashes(filePath.trim().replace(/\\/g, '/'));

    return /^[a-z]:\//i.test(normalized) || normalized.startsWith('/mnt/')
        ? normalized.toLowerCase()
        : normalized;
}

export function getPathComparisonVariants(filePath: string): string[] {
    const normalized = normalizePathForComparison(filePath);
    const variants = new Set([normalized]);

    const driveMatch = /^([a-z]):\/(.*)$/i.exec(normalized);
    if (driveMatch) {
        variants.add(`/mnt/${driveMatch[1]?.toLowerCase()}/${driveMatch[2] ?? ''}`);
    }

    const wslMountMatch = /^\/mnt\/([a-z])\/(.*)$/i.exec(normalized);
    if (wslMountMatch) {
        variants.add(`${wslMountMatch[1]?.toLowerCase()}:/${wslMountMatch[2] ?? ''}`);
    }

    return Array.from(variants);
}

function getDirectoryName(filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/');
    const lastSlashIndex = normalized.lastIndexOf('/');

    return lastSlashIndex === -1
        ? ''
        : normalized.slice(0, lastSlashIndex);
}

function getUniqueResolvedDirs(resolvedPaths: string[]): string[] {
    const seen = new Set<string>();
    const dirs: string[] = [];

    for (const resolvedPath of resolvedPaths) {
        const dir = getDirectoryName(resolvedPath);
        const comparableDir = normalizePathForComparison(dir);
        if (seen.has(comparableDir)) {
            continue;
        }

        seen.add(comparableDir);
        dirs.push(dir);
    }

    return dirs;
}

export function isPathInsideDir(filePath: string, dir: string): boolean {
    const pathVariants = getPathComparisonVariants(filePath);
    const dirVariants = getPathComparisonVariants(dir);

    return pathVariants.some(pathVariant => dirVariants.some((dirVariant) => {
        const withSlash = dirVariant.endsWith('/') ? dirVariant : `${dirVariant}/`;
        return pathVariant === dirVariant || pathVariant.startsWith(withSlash);
    }));
}

function formatPathList(paths: string[]): string {
    return paths.join(', ');
}

function getResolutionWarning(
    packageManager: GlobalPackageManager,
    resolvedPaths: string[],
    expectedBinDir: string | null
): string | null {
    const firstResolvedPath = resolvedPaths[0] ?? null;

    if (!firstResolvedPath) {
        return '⚠ 當前 PATH 中找不到 ccstatusline-zh-tw，Claude Code 會直接呼叫 ccstatusline-zh-tw，請重啟終端或更新 PATH。';
    }

    const resolvedDirs = getUniqueResolvedDirs(resolvedPaths);
    if (resolvedDirs.length > 1) {
        return `⚠ PATH 中存在多個 ccstatusline-zh-tw 可執行檔案，Claude Code 將使用第一個匹配：${firstResolvedPath}。\n其他匹配：${formatPathList(resolvedPaths.slice(1))}`;
    }

    if (expectedBinDir && !isPathInsideDir(firstResolvedPath, expectedBinDir)) {
        return `⚠ ccstatusline-zh-tw 解析到 ${firstResolvedPath}，不在 ${packageManager} 全域性 bin 目錄 (${expectedBinDir}) 內，Claude Code 仍會執行 PATH 中的首個匹配。`;
    }

    return null;
}

export function inspectGlobalCommandResolution(
    packageManager: GlobalPackageManager,
    options: ExecOptions = {}
): GlobalCommandResolution {
    const resolvedPaths = getPersistentCommandResolutionPaths(getCommandResolutionPaths('ccstatusline-zh-tw', options));
    const expectedBinDir = getExpectedGlobalBinDir(packageManager, options);

    return {
        resolvedPaths,
        firstResolvedPath: resolvedPaths[0] ?? null,
        expectedBinDir,
        warning: getResolutionWarning(packageManager, resolvedPaths, expectedBinDir)
    };
}
