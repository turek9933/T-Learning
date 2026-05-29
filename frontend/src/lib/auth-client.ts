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
            },
            schema: {
                organization: {
                    additionalFields: {
                        type: {
                            type: 'string',
                            defaultValue: 'single',
                            input: true,
                        },
                        description: {
                            type: 'string',
                            required: false,
                            input: true,
                        },
                        status: {
                            type: 'string',
                            defaultValue: 'draft',
                            input: true,
                        },
                        price: {
                            type: 'number',
                            required: false,
                            input: true,
                        },
                    },
                },
            },
        })
    ],
})