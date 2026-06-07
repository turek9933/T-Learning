import { User } from "lucide-react";
import Image from "next/image";

export default function Avatar({
    avatarUrl,
    name,
    size = 7,
    unoptimized = false,
}: {
    avatarUrl?: string | null;
    name?: string | null;
    size?: number;
    unoptimized?: boolean;
}) {
    const imageSize = size * 4;
    if (avatarUrl) {
        return (
            <Image
            src={avatarUrl}
            alt={name ?? "Avatar Image"}
            width={imageSize}
            height={imageSize}
            className="rounded-full object-cover"
            unoptimized={unoptimized}
            />
        );
    } else if (name) {
        return (
            <div className={`h-${size} w-${size} rounded-full bg-primary flex items-center justify-center text-text-contrast text-sm font-bold`}>
                {name.charAt(0).toUpperCase()}
            </div>
        );
    } else {
        return (
            <User className={`w-${size} h-${size}`} />
        );
    }
}