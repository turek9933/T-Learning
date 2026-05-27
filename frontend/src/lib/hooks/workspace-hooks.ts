import { useWorkspace } from '@/lib/queries/workspaces';
import { getWorkspaceConfig } from '@/types/workspace';

export function useWorkspaceData(slug: string) {
    const { data: workspace, isPending, isError } = useWorkspace(slug);
    const config = getWorkspaceConfig(workspace?.type);
    return { workspace, config, isPending, isError };
}