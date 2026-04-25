import { getMessages } from "next-intl/server";

export async function getAuthMessages() {
    const allMessages = await getMessages();
    return {
        auth: allMessages.auth,
    };
}

export async function getDashboardMessages() {
    const allMessages = await getMessages();
    return {
        dashboard: allMessages.dashboard,
    };
}