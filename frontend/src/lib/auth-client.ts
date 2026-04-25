import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { ac, owner, admin, member, viewer } from "@/lib/permissions"
import { env } from "@/lib/env"

export const authClient = createAuthClient({
    baseURL: env.apiUrl,
    fetchOptions: {
        credentials: 'include'
    },
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