import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/PageContainer";

export default function NotFound() {
    return (
    <PageContainer>
        <div className="text-center max-w-md">
            <h1 className="text-6xl md:text-8xl font-title font-bold text-text-secondary mb-4">
                404
            </h1>
            <h2 className="text-2xl md:text-3xl font-title font-bold text-text-primary mb-8">
                Page not found
            </h2>

            <p className="text-base md:text-lg text-text-secondary mb-4">
                Sorry, we could not find the page you are looking for.
            </p>

            <Button asChild size="lg">
                <Link href="/" className="bg-surface hover:bg-surface-overlay text-text hover:text-text-contrast">
                    Go back home
                </Link>
            </Button>
        </div>
    </PageContainer>
    );
}