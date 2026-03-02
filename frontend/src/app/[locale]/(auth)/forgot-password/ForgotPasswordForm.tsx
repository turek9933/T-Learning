"use client"

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { customToast } from "@/lib/customToast";
import { PageContainer } from "@/components/ui/PageContainer";
import { Banner } from "@/components/ui/Banner";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Mail, MoveLeft } from "lucide-react";

interface ForgotPasswordData {
    titleProp: string;
    subtitleProp: string;
    emailProp: string;
    emailPlaceholderProp: string;
    submitProp: string;
    successProp: string;
    errorProp: string;
    goBackProp: string;
}

export default function ForgotPasswordForm({ titleProp, subtitleProp, emailProp, emailPlaceholderProp, submitProp, successProp, errorProp, goBackProp }: ForgotPasswordData) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const { error } = await authClient.requestPasswordReset({
          email: email,
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
        });
        customToast.success(successProp);
      } catch (error) {
        customToast.error(errorProp);
      }
      setLoading(false);
    };

    return (
    <PageContainer>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Banner />
          <h2 className="text-2xl font-title font-bold text-text">
            {titleProp}
          </h2>
          <p className="text-text-secondary mt-2">
            {subtitleProp}
          </p>
        </div>

        <div className="bg-bg border border-border rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="email" className="block text-sm font-normal text-text mb-2">
                {emailProp}
              </label>
                <InputGroup className={`bg-bg-muted py-6`}>
                  <InputGroupInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={emailPlaceholderProp}
                  className="w-full font-normal"
                  required
                  />
                  <InputGroupAddon>
                    <Mail className="w-5 h-5 text-text-muted"/>
                  </InputGroupAddon>
                </InputGroup>
            </div>

            <Button
            id="forgot-button"
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover focus:bg-primary-hover text-text-contrast py-3"
            >
              {submitProp}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center items-center">
          <Link
          href="/"
          className="text-sm text-text-link hover:text-text-link-hover rounded py-2"
          >
            <MoveLeft className="inline w-4 h-4" />
            {"\t"}
            {goBackProp}
          </Link>
        </div>
      </div>
    </PageContainer>
    );
}