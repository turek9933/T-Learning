// All required environment variables are checked and redefined in the build process

const required = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_WS_URL",
    "NEXT_PUBLIC_MINIO_PUBLIC_URL",
    "NEXT_PUBLIC_PASSWORD_MIN_LENGTH",
    "NEXT_PUBLIC_WORKSPACE_NAME_MAX_LENGTH",
    "NEXT_PUBLIC_WORKSPACE_DESCRIPTION_MAX_LENGTH"
] as const;

const checkEnv = (key: string, value: string | undefined): string => {
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
}

export const env = {
    appUrl:                                     checkEnv("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL!),
    apiUrl:                                     checkEnv("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL!),
    wsUrl:                                      checkEnv("NEXT_PUBLIC_WS_URL", process.env.NEXT_PUBLIC_WS_URL!),
    minioPublicUrl:                             checkEnv("NEXT_PUBLIC_MINIO_PUBLIC_URL", process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL!),
    passwordMinLength:                          checkEnv("NEXT_PUBLIC_PASSWORD_MIN_LENGTH", process.env.NEXT_PUBLIC_PASSWORD_MIN_LENGTH!),
    workspaceNameMaxLength:                     checkEnv("NEXT_PUBLIC_WORKSPACE_NAME_MAX_LENGTH", process.env.NEXT_PUBLIC_WORKSPACE_NAME_MAX_LENGTH!),
    workspaceDescriptionMaxLength:              checkEnv("NEXT_PUBLIC_WORKSPACE_DESCRIPTION_MAX_LENGTH", process.env.NEXT_PUBLIC_WORKSPACE_DESCRIPTION_MAX_LENGTH!),
}