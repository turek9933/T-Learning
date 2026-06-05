'use client';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from '@/components/ui/input-group';
import Avatar from '@/components/shared/Avatar';
import { Input } from '@/components/ui/input';
import { PageContainer } from '@/components/layout/PageContainer';
import { customToast } from '@/components/CustomToast';
import { authClient } from '@/lib/auth-client';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateName, fetchAvatarUploadUrl, confirmAvatarUpload, checkEmailAvailable } from '@/lib/queries/users';
import { Unlink, Trash2, Eye, EyeOff } from 'lucide-react';
import { MAX_FILE_SIZE, AVATAR_ALLOWED_TYPES, formatFileSize} from "@/lib/hooks/file-hooks";


function ProfileSection() {
    const t = useTranslations('settings.profile');
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const [name, setName] = useState(user?.name ?? '');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const updateName = useUpdateName();
    const queryClient = useQueryClient();

    useEffect(() => setMounted(true), []);
    useEffect(() => {
        if (user?.name) {
            setName(user.name);
        }
    }, [user?.name]);

    const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
            customToast.error(t('errorAvatarType'));
            return;
        }
        if (file.size > MAX_FILE_SIZE['avatar']) {
            customToast.error(t('errorAvatarSize', { size: formatFileSize(MAX_FILE_SIZE['avatar']) }));
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSaveAvatar = async () => {
        if (!avatarFile) return;
        setSavingAvatar(true);
        try {
            const { uploadUrl, publicUrl } = await fetchAvatarUploadUrl();
            await fetch(uploadUrl, {
                method: 'PUT',
                body: avatarFile,
                headers: { 'Content-Type': avatarFile.type }
            });
            await confirmAvatarUpload(publicUrl);
            await queryClient.invalidateQueries({ queryKey: ['session'] });
            customToast.success(t('successAvatar'));
            setAvatarFile(null);
        } catch {
            customToast.error(t('errorAvatar', { size: formatFileSize(MAX_FILE_SIZE['avatar']) }));
        } finally {
            setSavingAvatar(false);
        }
    };

    const handleSaveName = async () => {
        if (!name.trim()) return;
        try {
            await updateName.mutateAsync(name.trim());
            customToast.success(t('successName'));
        } catch {
            customToast.error(t('errorName'));
        }
    };

    const currentAvatar = mounted ? (avatarPreview ?? user?.image ?? null) : null;
    const currentName = mounted ? user?.name : undefined;

    return (
        <div className="rounded-xl border border-border bg-bg p-6 space-y-4">
            <div className="space-y-2">
                <h2>{t('title')}</h2>
                <p className="text-sm text-text-muted">{t('subtitle')}</p>
            </div>
            <div className="space-y-2">
                <h6>{t('avatar')}</h6>
                <div className="flex items-center gap-2">
                    <Avatar avatarUrl={currentAvatar} name={currentName} size={16} unoptimized />
                    <div className="space-y-2">
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer"
                        >
                            {t('avatarChange')}
                        </Button>
                        <p className="text-xs text-text-muted">
                            {t('avatarHint', { size: formatFileSize(MAX_FILE_SIZE['avatar']) })}
                        </p>
                    </div>
                    <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarPick}
                    disabled={savingAvatar}
                    className="hidden"
                    />
                </div>
                {avatarFile && (
                    <Button
                    size="sm"
                    onClick={handleSaveAvatar}
                    disabled={savingAvatar}
                    className="cursor-pointer"
                    >
                        {savingAvatar ? t('saving') : t('save')}
                    </Button>
                )}
            </div>
            <div className="space-y-2">
                <h6>{t('name')}</h6>
                <div className="flex items-center gap-2">
                    <Input
                    value={name}
                    placeholder={t('namePlaceholder')}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    className="max-w-sm"
                    />
                    <Button
                    onClick={handleSaveName}
                    disabled={updateName.isPending || !name.trim() || name.trim() === user?.name}
                    className="cursor-pointer"
                    >
                        {updateName.isPending ? t('saving') : t('save')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function EmailSection() {
    const t = useTranslations('settings.email');
    const locale = useLocale();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const [newEmail, setNewEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [sent, setSent] = useState(false);
    const [sentToEmail, setSentToEmail] = useState('');
    const [resending, setResending] = useState(false);

    const handleSave = async () => {
        if (!newEmail.trim()) return;
        setSaving(true);
        try {
            const available = await checkEmailAvailable(newEmail.trim());
            if (!available) {
                customToast.error(t('errorEmailTaken'));
                return;
            }
            const result = await authClient.changeEmail({ newEmail: newEmail.trim() });
            if (result.error) {
                customToast.error(t('error'));
            } else {
                setSentToEmail(newEmail.trim());
                customToast.success(t('success', { email: user?.email || '' }));
                setNewEmail('');
                setSent(true);
            }
        } catch {
            customToast.error(t('error'));
        } finally {
            setSaving(false);
        }
    };

    const handleResend = async () => {
        if (!user?.email) return;
        setResending(true);
        try {
            await authClient.sendVerificationEmail({
                email: user.email,
                callbackURL: `/${locale}/verify-email`
            });
            customToast.success(t('successResend'));
        } catch {
            customToast.error(t('errorResend'));
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="rounded-xl border border-border bg-bg p-6 space-y-4">
            <div className="space-y-2">
                <h2>{t('title')}</h2>
                <p className="text-sm text-text-muted">{t('subtitle')}</p>
            </div>
            <div className="space-y-3">
                <p className="text-md font-medium text-text">{t('current')}</p>
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-md text-text-secondary">{user?.email}</p>
                    <span className={`
                        text-xs font-medium px-2 py-1 rounded-full 
                        ${user?.emailVerified
                        ? 'text-success bg-success-subtle'
                        : 'text-warning bg-warning-subtle'}
                    `}>
                        {user?.emailVerified ? t('verified') : t('notVerified')}
                    </span>
                </div>
                {!user?.emailVerified && (
                    <div className="flex flex-col items-end space-y-1">
                        <p className="text-xs text-text-secondary max-w-sm text-right">{t('resendHint')}</p>
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResend}
                        disabled={resending}
                        className="cursor-pointer"
                        >
                            {resending ? t('resending') : t('resend')}
                        </Button>
                    </div>
                )}
            </div>
            {user?.emailVerified && (
                <div className="space-y-2">
                    <h6>{t('new')}</h6>
                    <div className="flex items-center gap-2">
                        <Input
                        type="email"
                        value={newEmail}
                        placeholder={t('newPlaceholder')}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="max-w-sm"
                        />
                        <Button
                        onClick={handleSave}
                        disabled={saving || !newEmail.trim() || sent || newEmail.trim() === user?.email}
                        className="cursor-pointer"
                        >
                            {saving ? t('saving') : t('save')}
                        </Button>
                    </div>
                    {sent && (
                        <p className="my-2 p-2 max-w-sm text-sm text-text-secondary bg-bg-card rounded-lg">
                            {t('successHint', { email: sentToEmail })}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function PasswordSection() {
    const t = useTranslations('settings.password');
    const [hasPassword, setHasPassword] = useState<boolean | null>(null);
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        authClient.listAccounts().then((res) => {
            setHasPassword((res.data ?? []).some((a) => a.providerId === 'credential'));
        });
    }, []);

    if (hasPassword === null || !hasPassword) return null;

    const handleSave = async () => {
        if (next !== confirm) {
            customToast.error(t('errorMatch')); 
            return;
        }
        if (next.length < 10) {
            customToast.error(t('errorTooShort'));
            return;
        }
        setSaving(true);
        try {
            const result = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: false });
            if (result.error) {
                customToast.error(result.error.message?.toLowerCase().includes('invalid') ? t('errorCurrent') : t('error'));
            } else {
                customToast.success(t('success'));
                setCurrent('');
                setNext('');
                setConfirm('');
            }
        } catch {
            customToast.error(t('error'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-xl border border-border bg-bg p-6 space-y-4">
            <div className="space-y-2">
                <h2>{t('title')}</h2>
                <p className="text-sm text-text-muted">{t('subtitle')}</p>
            </div>
            <div className="space-y-3 max-w-sm">
                <div>
                    <label htmlFor="password" className="block text-sm font-normal text-text mb-2">
                        {t("current")}
                    </label>
                    <InputGroup className="bg-bg-card">
                        <InputGroupInput
                        id="password"
                        type={showCurrent ? "text" : "password"}
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                        placeholder={t("currentPlaceholder")}
                        />
                        <InputGroupAddon align="inline-end">
                            <InputGroupButton size="sm" onClick={() => setShowCurrent((prev) => !prev)}>
                                { showCurrent ?
                                <Eye className="w-5 h-5 text-text-muted"/>
                                :
                                <EyeOff className="w-5 h-5 text-text-muted"/>
                                }
                            </InputGroupButton>
                        </InputGroupAddon>
                    </InputGroup>
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-normal text-text mb-2">
                        {t("new")}
                    </label>
                    <InputGroup className="bg-bg-card">
                        <InputGroupInput
                        id="newPassword"
                        type={showNext ? "text" : "password"}
                        value={next}
                        onChange={(e) => setNext(e.target.value)}
                        placeholder={t("newPlaceholder")}
                        />
                        <InputGroupAddon align="inline-end">
                            <InputGroupButton size="sm" onClick={() => setShowNext((prev) => !prev)}>
                                { showNext ?
                                <Eye className="w-5 h-5 text-text-muted"/>
                                :
                                <EyeOff className="w-5 h-5 text-text-muted"/>
                                }
                            </InputGroupButton>
                        </InputGroupAddon>
                    </InputGroup>
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-normal text-text mb-2">
                        {t("confirm")}
                    </label>
                    <InputGroup className="bg-bg-card">
                        <InputGroupInput
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder={t("confirmPlaceholder")}
                        />
                        <InputGroupAddon align="inline-end">
                            <InputGroupButton size="sm" onClick={() => setShowConfirm((prev) => !prev)}>
                                { showConfirm ?
                                <Eye className="w-5 h-5 text-text-muted"/>
                                :
                                <EyeOff className="w-5 h-5 text-text-muted"/>
                                }
                            </InputGroupButton>
                        </InputGroupAddon>
                    </InputGroup>
                </div>
            </div>
            <Button
            onClick={handleSave}
            disabled={saving || !current || !next || !confirm}
            className="cursor-pointer">
                {saving ? t('saving') : t('save')}
            </Button>
        </div>
    );
}

type ListedAccount = { id: string; providerId: string; accountId: string; scopes: string[] };

//TODO fully test this
function ConnectedAccountsSection() {
    const t = useTranslations('settings.accounts');
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const [accounts, setAccounts] = useState<ListedAccount[]>([]);
    const [unlinking, setUnlinking] = useState<string | null>(null);

    useEffect(() => {
        authClient.listAccounts().then((res) => {
            if (res.data) {
                setAccounts(res.data.filter((a) => a.accountId !== user?.id) as unknown as ListedAccount[]);
            }
        });
    }, []);

    const handleUnlink = async (providerId: string) => {
        setUnlinking(providerId);
        try {
            await authClient.unlinkAccount({ providerId })
            .then((res) => {
                if (res.error) {
                    console.error(res.error);
                    throw new Error(res.error.message);
                }
            })
            setAccounts((prev) => prev.filter((a) => a.providerId !== providerId));
            customToast.success(t('successUnlink'));
        } catch {
            customToast.error(t('errorUnlink'));
        } finally {
            setUnlinking(null);
        }
    };

    return (
        <div className="rounded-xl border border-border bg-bg p-6 space-y-4">
            <div className="space-y-2">
                <h2>{t('title')}</h2>
                <p className="text-sm text-text-muted">{t('subtitle')}</p>
            </div>
            {accounts.length === 0
                ? <p className="text-sm text-text-muted">{t('noAccounts')}</p>
                : <ul className="space-y-2">
                    {accounts.map((acc) => (
                        <li
                        key={acc.providerId}
                        className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-text capitalize">{acc.providerId}</span>
                                <span className="text-xs text-text-muted">{acc.accountId}</span>
                            </div>
                            <Button
                            variant="ghost"
                            size="sm"
                            disabled={unlinking === acc.providerId}
                            onClick={() => handleUnlink(acc.providerId)}
                            className="cursor-pointer gap-2"
                            >
                                <Unlink className="w-4 h-4" />
                                {unlinking === acc.providerId ? t('unlinking') : t('unlink')}
                            </Button>
                        </li>
                    ))}
                </ul>
            }
        </div>
    );
}

function DangerSection() {
    const t = useTranslations('settings.danger');
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const result = await authClient.deleteUser({ password });
            if (result.error) {
                const msg = result.error.message?.toLowerCase() ?? '';
                customToast.error(msg.includes('invalid') || msg.includes('password') ? t('errorDeletePassword') : t('errorDelete'));
            } else {
                customToast.success(t('successDelete'));
                router.push('/');
            }
        } catch {
            customToast.error(t('errorDelete'));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="rounded-xl border border-border bg-bg p-6 space-y-4">
            <div className="space-y-2">
                <h2>{t('title')}</h2>
                <p className="text-sm text-text-muted">{t('subtitle')}</p>
            </div>
            <div className="rounded-lg border border-2 border-error p-4 space-y-3 bg-bg-card">
                <div className="space-y-2">
                    <h6 className="text-error">{t('deleteTitle')}</h6>
                    <p className="text-xs text-text-secondary underline">{t('deleteDescription')}</p>
                </div>
                {!open ? (
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(true)}
                    className="border-error text-error hover:bg-error-subtle hover:text-text cursor-pointer gap-2">
                        <Trash2 className="w-4 h-4" />
                        {t('deleteButton')}
                    </Button>
                ) : (
                    <div className="space-y-3">
                        <h6>{t('deleteConfirmTitle')}</h6>
                        <p className="text-xs text-text">{t('deleteConfirmDescription')}</p>
                        <div className="max-w-sm">
                            <label htmlFor="password" className="block text-sm font-normal text-text mb-2">
                                {t("deletePassword")}
                            </label>
                            <InputGroup className="bg-bg border border-accent">
                                <InputGroupInput
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t("deletePasswordPlaceholder")}
                                />
                                <InputGroupAddon align="inline-end">
                                    <InputGroupButton size="sm" onClick={() => setShowPassword((prev) => !prev)}>
                                        { showPassword ?
                                        <Eye className="w-5 h-5 text-text-muted"/>
                                        :
                                        <EyeOff className="w-5 h-5 text-text-muted"/>
                                        }
                                    </InputGroupButton>
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                        <div className="flex gap-2">
                            <Button
                            size="sm" 
                            disabled={deleting || !password}
                            onClick={handleDelete}
                            className="bg-error text-text-contrast hover:bg-error-subtle hover:text-text cursor-pointer"
                            >
                                {deleting ? t('deleteDeleting') : t('deleteConfirm')}
                            </Button>
                            <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setOpen(false);
                                setPassword('');
                            }}
                            className="cursor-pointer"
                            >
                                {t('deleteCancel')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const t = useTranslations('settings');
    return (
        <PageContainer>
            <div className="w-full max-w-4xl space-y-6">
                <div className="text-center">
                    <h2>{t('title')}</h2>
                    <p className="text-text-muted">{t('subtitle')}</p>
                </div>
                <ProfileSection />
                <EmailSection />
                <PasswordSection />
                <ConnectedAccountsSection />
                <DangerSection />
            </div>
        </PageContainer>
    );
}