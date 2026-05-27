import type { WorkspaceType } from '@/lib/queries/workspaces';

export interface WorkspaceFeatures {
    posts: boolean;
    homework: boolean;
    materials: boolean;
    calendar: boolean;
    chat: boolean;
    events: boolean;
    members: boolean;
}

export interface WorkspaceNavItem {
    key: string;
    subPath: string;
    iconName: string;
}

export interface WorkspaceTypeConfig {
    features: WorkspaceFeatures;
    navItems: WorkspaceNavItem[];
}

export const WORKSPACE_CONFIG: Record<WorkspaceType, WorkspaceTypeConfig> = {
    single: {
        features: {
            posts: false,
            homework: true,
            materials: true,
            calendar: true,
            chat: true,
            events: true,
            members: true,
        },
        navItems: [
            { key: 'workspaceMain',      subPath: '',           iconName: 'BookOpen' },
            { key: 'workspaceChat',      subPath: '/chat',      iconName: 'MessageSquare' },
            { key: 'workspaceCalendar',  subPath: '/calendar',  iconName: 'Calendar' },
            { key: 'workspaceMaterials', subPath: '/files',     iconName: 'FolderOpen' },
            // { key: 'workspaceHomeworks', subPath: '/homeworks', iconName: 'ClipboardList' },
            { key: 'workspaceMembers',   subPath: '/members',   iconName: 'Users' },
            { key: 'workspaceSettings',  subPath: '/settings',  iconName: 'Cog' },
        ],
    },
    group: {
        features: {
            posts: true,
            homework: true,
            materials: true,
            calendar: true,
            chat: false,
            events: true,
            members: true,
        },
        navItems: [
            { key: 'workspaceMain',      subPath: '',           iconName: 'BookOpen' },
            // { key: 'workspaceHomeworks', subPath: '/homeworks', iconName: 'ClipboardList' },
            { key: 'workspaceCalendar',  subPath: '/calendar',  iconName: 'Calendar' },
            { key: 'workspaceMaterials', subPath: '/files',     iconName: 'FolderOpen' },
            { key: 'workspaceMembers',   subPath: '/members',   iconName: 'Users' },
            { key: 'workspaceSettings',  subPath: '/settings',  iconName: 'Cog' },
        ],
    },
};

export function getWorkspaceConfig(type: WorkspaceType | null | undefined): WorkspaceTypeConfig {
    return WORKSPACE_CONFIG[type ?? 'group'] ?? WORKSPACE_CONFIG.group;
}
