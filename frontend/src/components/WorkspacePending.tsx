import { PageContainer } from "./ui/PageContainer";

export default function WorkspacePending() {
    return (
        <PageContainer>
            <div className='animate-pulse w-full space-y-4'>
                <div className="h-10 w-64 rounded-lg bg-bg-card hover:bg-bg-hover" />
                <div className="h-8 w-40 rounded-lg bg-bg-card hover:bg-bg-hover" />
                <div className="h-48 rounded-xl bg-bg-card hover:bg-bg-hover" />
            </div>
        </PageContainer>
    );
}