import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import NewWorkspaceForm from "./NewWorkspaceForm";

export default async function NewWorkspacePage() {
    const allMessages = await getMessages();
    const t = {
        new: allMessages.dashboard.workspace.new
    }
    return (
        <NextIntlClientProvider messages={t}>
            <NewWorkspaceForm />
        </NextIntlClientProvider>
    );
}