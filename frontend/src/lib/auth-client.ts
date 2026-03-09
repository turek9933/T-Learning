import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { ac, owner, admin, member, viewer } from "@/lib/permissions"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    plugins: [
        organizationClient({
            ac,
            roles: {
                owner,
                admin,
                member,
                viewer
            }
        })
    ],
})