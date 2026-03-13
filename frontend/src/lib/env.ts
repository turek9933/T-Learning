// All required environment variables are checked and redefined in the build process
// Prefix NEXT_PUBLIC_ is currently required, but handled in the build process

const required = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_PASSWORD_MIN_LENGTH",
    "NEXT_PUBLIC_WORKSPACE_NAME_MAX_LENGTH",
    "NEXT_PUBLIC_WORKSPACE_DESCRIPTION_MAX_LENGTH"
] as const;

// console.log('[env]:', process.env);

console.warn('[appUrl]:', process.env.NEXT_PUBLIC_APP_URL);

for (const key of required) {
        console.warn(`Missing environment variable: ${key}, [is present]: ${!!process.env[key]}`);
        console.warn(`[Dynamic is present]: ${!process.env[key]}`);

    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
}

export const env = {
    appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    passwordMinLength: process.env.NEXT_PUBLIC_PASSWORD_MIN_LENGTH!,
    workspaceNameMaxLength: process.env.NEXT_PUBLIC_WORKSPACE_NAME_MAX_LENGTH!,
    workspaceDescriptionMaxLength: process.env.NEXT_PUBLIC_WORKSPACE_DESCRIPTION_MAX_LENGTH!
}