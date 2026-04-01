'use client';
import { useTranslations } from 'next-intl';
import { PageContainer } from '@/components/ui/PageContainer';
import { useParams } from 'next/navigation';
import { useWorkspace } from '@/lib/queries/workspaces';
import WorkspacePending from '@/components/WorkspacePending';
import WorkspaceError from '@/components/WorkspaceError';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useValidationSchemas, EditWorkspaceFormData } from '@/lib/validation';
import { customToast } from '@/lib/customToast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Pencil, Play, FileArchive, History, Shredder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/routing';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

function EditSection({ slug }: { slug: string }) {
    const t = useTranslations('dashboard.workspace.settings');
    const queryClient = useQueryClient();
    const { data: workspace } = useWorkspace(slug);
    const { editWorkspaceSchema } = useValidationSchemas();

    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = useForm<EditWorkspaceFormData>({
      resolver: zodResolver(editWorkspaceSchema),
    });

    // TODO: add mutation
    const placeholderFetch = async (data: EditWorkspaceFormData) => {
      console.log(data);
    };

    const mutation = useMutation({
        // TODO: add mutation
        mutationFn: (data: EditWorkspaceFormData) => placeholderFetch(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces', slug] });
            queryClient.invalidateQueries({ queryKey: ['workspaces', 'me'] });
            customToast.success(t('successEdit'));
        },
        onError: () => customToast.error(t('errorEdit')),
    });

    return (
        <section className="flex flex-col w-full max-w-lg items-center space-y-4">
            <h4>{t('edit')}</h4>
            <form
            className="flex flex-col w-full gap-4"
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            >
                <div className="flex flex-col space-y-2">
                    <label htmlFor="name" className='mb-2 font-semibold'>{t('name')}</label>
                    <InputGroup
                    className={`bg-bg-muted py-6 ${errors.name ? "ring-2 ring-error border-error" : ""}`}>
                        <InputGroupInput
                        id="name"
                        type="text"
                        {...register("name")}
                        placeholder={workspace?.name || t("namePlaceholder")}
                        className="w-full font-normal"
                        required
                        />
                        <InputGroupAddon>
                        <Pencil className="w-5 h-5 text-text-muted"/>
                        </InputGroupAddon>
                    </InputGroup>
                    {errors.name && <p className="text-error">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col space-y-2">
                    <label htmlFor="description" className='mb-2 font-semibold'>{t('description')}</label>
                    <InputGroup
                    className={`bg-bg-muted py-6 ${errors.description ? "ring-2 ring-error border-error" : ""}`}>
                        <InputGroupInput
                        id="description"
                        type="text"
                        {...register("description")}
                        placeholder={workspace?.description || t("descriptionPlaceholder")}
                        className="w-full font-normal"
                        required
                        />
                        <InputGroupAddon>
                        <Pencil className="w-5 h-5 text-text-muted"/>
                        </InputGroupAddon>
                    </InputGroup>
                    {errors.description && <p className="text-error">{errors.description.message}</p>}
                </div>
                <div className="flex flex-col space-y-2">
                    <label htmlFor="price" className='mb-2 font-semibold'>{t('price')}</label>
                    <InputGroup
                    className={`bg-bg-muted py-6 ${errors.description ? "ring-2 ring-error border-error" : ""}`}>
                        <InputGroupInput
                        id="price"
                        type="number"
                        {...register("price", {
                            setValueAs: (value) => value === '' ? undefined : Number(value),
                        })}
                        placeholder={workspace?.price?.toString() || t("pricePlaceholder")}
                        className="w-full font-normal"
                        required
                        />
                        <InputGroupAddon>
                        <Pencil className="w-5 h-5 text-text-muted"/>
                        </InputGroupAddon>
                    </InputGroup>
                    {errors.description && <p className="text-error">{errors.description.message}</p>}
                </div>
                <Button
                id="edit-workspace"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary-hover focus:bg-primary-hover text-text-contrast py-3 my-4 cursor-pointer"
                >
                {isSubmitting ? t("updating") : t("update")}
                </Button>
            </form>
        </section>
    );
}

function StatusSection({ slug }: { slug: string }) {
    const t = useTranslations('dashboard.workspace.settings');
    const queryClient = useQueryClient();
    const { data: workspace } = useWorkspace(slug);
    const status = workspace?.status || 'draft' as 'draft' || 'active' || 'archived';

    // TODO: add mutation
    const placeholderFetch = async (data: 'draft' | 'active' | 'archived') => {
        console.log(data);
    };
    const mutation = useMutation({
        // TODO: add mutation
        mutationFn: (data: 'draft' | 'active' | 'archived') => placeholderFetch(data),
        onSuccess: (_, data) => {
            queryClient.invalidateQueries({ queryKey: ['workspaces', slug] });
            queryClient.invalidateQueries({ queryKey: ['workspaces', 'me'] });
            customToast.success(t(`successStatus${data.charAt(0).toUpperCase() + data.slice(1)}`));
        },
        onError: () => customToast.error(t('errorEdit')),
    });

    const transitions: Record<'draft' | 'active' | 'archived', {next: 'draft' | 'active' | 'archived', label: string, icon: React.ElementType}> = {
        draft: {next: 'active', label: 'activate', icon: Play},
        active: {next: 'archived', label: 'archive', icon: FileArchive},
        archived: {next: 'active', label: 'restore', icon: History},
    }

    const possibleTransitions = transitions[status];

    return (
        <section className="flex flex-col w-full max-w-lg items-center space-y-4">
            <h4>{t('status')}</h4>
            <p className="font-normal text-text-secondary">{t('statusDescription')}</p>
            {possibleTransitions && (
                <Button
                id="edit-status"
                type="button"
                onClick={() => mutation.mutate(possibleTransitions.next)}
                className="bg-primary hover:bg-primary-hover focus:bg-primary-hover text-text-contrast py-3 cursor-pointer"
                >
                    <possibleTransitions.icon className="w-5 h-5 mr-2" />
                    {t(possibleTransitions.label)}
                </Button>
            )}
        </section>
    );
}

function DeleteSection({ slug }: { slug: string }) {
    const t = useTranslations('dashboard.workspace.settings');
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: workspace } = useWorkspace(slug);
    const [confirm, setConfirm] = useState(false);
    const [confirmName, setConfirmName] = useState('');
    const nameMatches = workspace?.name === confirmName;

    // TODO: add mutation
    const placeholderFetch = async (slug: string) => {
        console.log(slug);
    };
    const mutation = useMutation({
        // TODO: add mutation
        mutationFn: () => placeholderFetch(slug),
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: ['workspaces', slug] });
            queryClient.invalidateQueries({ queryKey: ['workspaces', 'me'] });
            customToast.success(t('successDelete'));
            router.push('/dashboard');
        },
        onError: () => customToast.error(t('errorDelete')),
    });

    return (
        <section className="flex flex-col w-full max-w-lg items-center space-y-4">
            <h4>{t('delete')}</h4>
            <p className="font-normal text-text-secondary">{t('deleteDescription')}</p>
            {confirm ? (
                 <div className="space-y-3">
                    <p className="text-sm text-text-secondary">
                        {t('deleteConfirmInstruction')}{' '}
                        <span className="font-semibold text-text">{workspace?.name}</span>
                    </p>
                    <Input
                    value={confirmName}
                    onChange={e => setConfirmName(e.target.value)}
                    placeholder={workspace?.name ?? ''}
                    className={nameMatches ? 'border-error' : ''}
                    autoFocus
                    />
                    <div className="flex flex-col md:flex-row justify-center gap-2">
                        <Button
                        disabled={!nameMatches || mutation.isPending}
                        onClick={() => mutation.mutate()}
                        className="gap-2 bg-error hover:bg-error text-text-contrast py-3 cursor-not-allowed"
                        >
                            <Shredder className="w-4 h-4" />
                            {mutation.isPending ? t('deleting') : t('deleteConfirm')}
                        </Button>
                        <Button
                            variant="ghost"
                            disabled={mutation.isPending}
                            onClick={() => { setConfirm(false); setConfirmName(''); }}
                        >
                            {t('cancel')}
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                id="delete-workspace"
                type="button"
                variant="ghost"
                onClick={() => setConfirm(true)}
                className="bg-error hover:bg-error-hover focus:bg-error-hover text-text-contrast py-3 cursor-not-allowed"
                >
                    <Shredder className="w-5 h-5 mr-2" />
                    {t('delete')}
                </Button>
            )}
        </section>
    );
}

    
export default function WorkspaceEditPage() {
    const t = useTranslations('dashboard.workspace.settings');
    const { slug } = useParams<{ slug: string }>();
    const { data: workspace, isPending, isError } = useWorkspace(slug);

    if (isPending)
        return <WorkspacePending />;
    if (isError || !workspace)
        return <WorkspaceError errorMessage={t('errorLoad')} />


    const isOwner = workspace.role === 'owner';
    const isOwnerOrAdmin = isOwner || workspace.role === 'admin';

    if (!isOwnerOrAdmin)
        return <WorkspaceError errorMessage={t('errorPermission')} />



    return (
        <PageContainer>
            <div className="flex flex-col w-full max-w-lg items-center space-y-4">
                <h2 className="text-text mb-2">
                    {t('title')}
                </h2>
                <p className="text-text-secondary">
                    {t('subtitle')}
                </p>
                <h3 className="text-text">
                    {workspace.name}
                </h3>
                <EditSection slug={slug} />
                <StatusSection slug={slug} />
                {isOwner && <DeleteSection slug={slug} />}
            </div>
        </PageContainer>
    )
}