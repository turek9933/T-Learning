import { PageContainer } from "./ui/PageContainer"

export default function WorkspaceError({ errorMessage }: { errorMessage: string }) {
    return (
        <PageContainer>
            <div className="text-center max-w-md">
                <h2 className="text-text m-4">
                    {errorMessage}
                </h2>
            </div>
        </PageContainer>
    );
}