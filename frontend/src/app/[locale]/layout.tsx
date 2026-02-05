import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";

export default function LocaleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
    <ThemeProvider>
        {/* Full height, column layout - Navbar at the top */}
        <div className="min-h-screen flex flex-col">
            <Navbar />
            {/* content uses full available space */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    </ThemeProvider>
    );
}