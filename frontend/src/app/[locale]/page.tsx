import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Layers, CreditCard, MonitorSmartphone, Zap, Shield, Wifi } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Banner } from "@/components/Banner";

export default async function LandingPage() {
    const t = await getTranslations("landing");
    
    return (
    <PageContainer sidebar={false}>
        <section className="py-4 lg:py-12 container">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                <Banner />

                <h2 className="text-2xl md:text-4xl lg:text-5xl font-title font-bold mb-6 text-text">
                    {t("heroTitle")}
                </h2>
            
                <p className="text-base md:text-lg lg:text-xl text-text-secondary mb-8 max-w-2xl">
                    {t("heroSubtitle")}
                </p>

                <div className="flex flex-col lg:flex-row gap-4 w-auto lg:w-full justify-center">
                    <Button 
                    asChild 
                    size="lg" 
                    className="bg-primary hover:bg-primary-hover text-text-contrast w-auto "
                    >
                        <Link href="/login">
                            {t("login")}
                        </Link>
                    </Button>
                    <Button 
                    asChild 
                    variant="outline" 
                    size="lg"
                    className="border-border hover:bg-bg-card w-auto"
                    >
                        <a href="#about">
                            {t("learnMore")}
                        </a>
                    </Button>
                </div>
            </div>
        </section>

        <div id="about" className="h-6"></div>

        <section className="py-6 lg:py-8 container">
            <div className="max-w-2xl mx-auto text-center">
                <h3 className="text-xl lg:text-2xl font-title font-bold mb-4 text-text">
                    {t("aboutTitle")}
                </h3>
                <p className="text-base lg:text-lg text-text-secondary leading-relaxed">
                    {t("aboutDescription")}
                </p>
            </div>
        </section>

        <section id="features" className="py-8 lg:py-10 container">
            <div className="text-center mb-8">
                <h3 className="text-xl lg:text-2xl font-title font-bold mb-4 text-text">
                    {t("featuresTitle")}
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title={t("feature1Title")}
                description={t("feature1Description")}
                />
                <FeatureCard
                icon={<Wifi className="w-6 h-6" />}
                title={t("feature2Title")}
                description={t("feature2Description")}
                />
                <FeatureCard
                icon={<Layers className="w-6 h-6" />}
                title={t("feature3Title")}
                description={t("feature3Description")}
                />
                <FeatureCard
                icon={<CreditCard className="w-6 h-6" />}
                title={t("feature4Title")}
                description={t("feature4Description")}
                />
                <FeatureCard
                icon={<MonitorSmartphone className="w-6 h-6" />}
                title={t("feature5Title")}
                description={t("feature5Description")}
                />
                <FeatureCard
                icon={<Shield className="w-6 h-6" />}
                title={t("feature6Title")}
                description={t("feature6Description")}
                />
            </div>
        </section>

        <section className="py-6 lg:py-10 container">
            <div className="max-w-3xl mx-auto text-center bg-bg border border-border rounded-2xl p-8 lg:p-12">
                <h3 className="text-xl lg:text-2xl font-title font-bold mb-2 text-text">
                    {t("callToAction")}
                </h3>
                <p className="text-base lg:text-lg text-text-secondary mb-6">
                    {t("callToActionDescription")}
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <Button
                    asChild 
                    size="lg"
                    className="bg-primary hover:bg-primary-hover text-text-contrast w-auto"
                    >
                        <Link href="/register">
                            {t("register")}
                        </Link>
                    </Button>
                    <Button 
                    asChild 
                    variant="outline" 
                    size="lg"
                    className="border-border hover:bg-bg-card w-auto"
                    >
                        <Link href="/login">
                            {t("login")}
                        </Link>
                    </Button>
                </div>
            </div>
        </section>

        <footer className="border-t border-border mt-16 w-full">
            <div className="container py-4">
                <div className="flex flex-col justify-between items-center gap-2">
                    <p className="text-sm text-text-muted text-center">
                        {t("copyright")}
                    </p>
                    <div className="flex gap-4">
                        <a href="/privacy-policy" className="text-xs text-text-link hover:text-text-linkHover">
                            {t("privacyPolicy")}
                        </a>
                        <a href="/terms" className="text-xs text-text-link hover:text-text-linkHover">
                            {t("terms")}
                        </a>
                        <a href="/contact" className="text-xs text-text-link hover:text-text-linkHover">
                            {t("contact")}
                        </a>
                    </div>
                </div>
            </div>
      </footer>
    </PageContainer>
  );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
    <div className="bg-bg border-2 border-border rounded-lg p-4 hover:border-border-subtle transition-all duration-400">
        <div className="w-12 h-12 bg-primary-subtle rounded-lg flex items-center justify-center text-primary mb-2">
            {icon}
        </div>
        <h4 className="font-title font-bold text-lg mb-2 text-text">
            {title}
        </h4>
        <p className="text-text-secondary text-sm">
            {description}
        </p>
    </div>
    );
}