import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";

export default function NotFound() {
    return (
    <PageContainer sidebar={false}>
        <div className="text-center max-w-md">
            <h1 className="font-title font-bold text-text-secondary mb-4">
                404
            </h1>
            <h2 className="font-title font-bold text-text mb-8">
                Page not found
            </h2>

            <p className="text-base md:text-lg text-text-secondary mb-4">
                Sorry, we could not find the page you are looking for.
            </p>

            <Button asChild size="lg">
                <Link href="/" className="bg-bg hover:bg-bg-hover text-text">
                    Go back home
                </Link>
            </Button>
        </div>
    </PageContainer>
    );
}