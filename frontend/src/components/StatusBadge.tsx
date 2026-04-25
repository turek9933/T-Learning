import { WorkspaceItem } from "@/lib/queries/workspaces";
import { Activity, LibraryBig, PencilLine } from "lucide-react";

export const icons: Record<string, React.ElementType> = {
    active:   Activity,
    draft:    PencilLine,
    archived: LibraryBig,
};

export default function StatusBadge({ status = 'draft', size = '4' }: { status: WorkspaceItem['status'], size?: string }) {
    const styles: Record<string, string> = {
        active:   'text-success',
        draft:    'text-warning',
        archived: 'text-text-muted',
    };
    const x = status || 'draft';
    const IconComponent = icons[x] ?? icons.draft;
    return <IconComponent className={`w-${size} h-${size} ${styles[x] ?? styles.draft}`} />
}