'use client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@/lib/auth-client';
import { customToast } from '@/lib/customToast';
import { useValidationSchemas, WorkspaceFormData } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Users, User, TriangleAlert, Group } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { CustomBreadcrumb } from '@/components/CustomBreadcrumb';

function generateSlug(name: string): string {
    return name
        .normalize('NFKD')// remove diacritics
        .replace(/[\u0300-\u036f]/g, '')// remove diacritics
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')// remove special characters
        .replace(/\s+/g, '-')// replace spaces with hyphens
        .replace(/-+/g, '-')// replace multiple hyphens with single one
        .replace(/^-|-$/g, '');
}

export default function NewWorkspaceForm() {
    const t = useTranslations('dashboard.workspace.new');
    const router = useRouter();
    const { workspaceSchema } = useValidationSchemas();

    const [slugEdited, setSlugEdited] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<WorkspaceFormData>({
        resolver: zodResolver(workspaceSchema),
        defaultValues: {
            name: '',
            slug: '',
            type: 'single',
            description: '',
        },
    });

    const nameWatch = watch('name');

    useEffect(() => {
        if (!slugEdited && nameWatch) {
            setValue('slug', generateSlug(nameWatch), { shouldValidate: false });
        }
    }, [nameWatch, slugEdited, setValue]);

    const onSubmit = async (data: WorkspaceFormData) => {
        const { data: workspace, error } = await authClient.organization.create({
            name: data.name,
            slug: data.slug,
            type: data.type,
            status: 'draft',
            ...(data.description ? { description: data.description } : {}),
            ...(data.price !== undefined ? { price: data.price } : {}),
        } as any);// as any because the type is defined in the backend

        if (error) {
            console.warn(error);
            if (error.code === "ORGANIZATION_ALREADY_EXISTS") {
                setError('slug', { message: t('errorSlugTaken') });
                customToast.error(t('errorSlugTaken'));
                return;
            }
            customToast.error(t('errorCreate'));
            return;
        }

        customToast.success(t('successCreate'));
        router.push(`/workspaces/${workspace?.slug}`);
    };

    return (
        <PageContainer>
        <div className="container w-full min-h-screen bg-bg-muted py-8">
            <div className="mb-10">
                <CustomBreadcrumb />
                <h2 className="font-title font-bold text-text">
                    {t('title')}
                </h2>
                <p className="text-text-secondary mt-2">
                    {t('subtitle')}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
                {/* Type */}
                <div className="flex flex-col gap-2">
                    <label className="text-md font-semibold text-text-secondary">
                        {t('type')}
                    </label>          
                    <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                        <div className="flex flex-col md:flex-row gap-4 py-2">
                            <Button
                            key="group"
                            type="button"
                            variant="secondary"
                            onClick={() => field.onChange('group')}
                            className={`
                                gap-2 p-2 rounded-xl border-2 text-left flex-row w-full sm:w-1/2
                                ${field.value === 'group'
                                ? 'border-primary bg-primary-subtle'
                                : 'border-border bg-bg hover:border-border-hover'}
                            `}>
                                <Users className={`w-5 h-5 ${field.value === 'group' ? 'text-primary' : 'text-text-muted'}`} />
                                <span className={`font-semibold text-sm ${field.value === 'group' ? 'text-text' : 'text-text-secondary'}`}>
                                    {t('typeGroup')}
                                </span>
                                <span className="text-xs text-text-muted hidden sm:block">
                                    {t('typeGroupDescription')}
                                </span>
                            </Button>
                            <Button
                            key="single"
                            type="button"
                            variant="secondary"
                            onClick={() => field.onChange('single')}
                            className={`
                                gap-2 p-2 rounded-xl border-2 text-left flex-row w-full sm:w-1/2
                                ${field.value === 'single'
                                ? 'border-primary bg-primary-subtle'
                                : 'border-border bg-bg hover:border-border-hover'}
                            `}>
                                <User className={`w-5 h-5 ${field.value === 'single' ? 'text-primary' : 'text-text-muted'}`} />
                                <span className={`font-semibold text-sm ${field.value === 'single' ? 'text-text' : 'text-text-secondary'}`}>
                                    {t('typeSingle')}
                                </span>
                                <span className="text-xs text-text-muted hidden sm:block">
                                    {t('typeSingleDescription')}
                                </span>
                            </Button>
                        </div>)}
                    />
                </div>

                {/* Name */}
                <div>
                    <label htmlFor="name" className="text-md font-semibold text-text-secondary">
                        {t('name')}
                        <span className="text-error"> *</span>
                    </label>
                    <Input
                    id="name"
                    {...register('name')}
                    placeholder={t('placeholderName')}
                    className={errors.name ? 'border-error ring-1 ring-error bg-bg' : 'bg-bg'}
                    />
                    {errors.name && (
                        <p className="flex items-center gap-1 text-xs text-error mt-1">
                            <TriangleAlert className="w-3 h-3" />
                            {errors.name.message}
                        </p>
                    )}
                </div>

                {/* Slug */}
                <div>
                    <label htmlFor="slug" className="text-md font-semibold text-text-secondary">
                        {t('slug')}
                        <span className="text-error"> *</span>
                        <span className="ml-2 text-xs font-normal text-text-muted">
                            {t('slugHint')}
                        </span>
                    </label>
                    <div
                    className={`
                        flex items-center rounded-lg border bg-bg
                        ${errors.slug ? 'border-error ring-1 ring-error' : 'border-border'}
                    `}>
                        <span className="px-3 py-2 text-sm text-text-muted bg-bg-muted border-border">
                            /workspaces/
                        </span>
                        <Input
                        id="slug"
                        {...register('slug', {
                            onChange: () => setSlugEdited(true),
                        })}
                        className="flex-1 px-3 py-2 text-sm bg-bg text-text outline-none"
                        placeholder={t('placeholderSlug')}
                        />
                    </div>
                    {errors.slug && (
                        <p className="flex items-center gap-1 text-xs text-error mt-1">
                            <TriangleAlert className="w-3 h-3" />
                            {errors.slug.message}
                        </p>
                    )}
                </div>

                {/* Descricption */}
                <div>
                    <label htmlFor="description" className="text-md font-semibold text-text-secondary">
                        {t('description')}
                        <span className="ml-2 text-xs font-normal text-text-muted">
                            {t('optional')}
                        </span>
                    </label>
                    <Textarea
                    id="description"
                    {...register('description')}
                    rows={3}
                    placeholder={t('placeholderDescription')}
                    className={errors.description ? 'border-error ring-1 ring-error bg-bg' : 'bg-bg'}
                    />
                    {errors.description && (
                        <p className="flex items-center gap-1 text-xs text-error mt-1">
                            <TriangleAlert className="w-3 h-3" />
                            {errors.description.message}
                        </p>
                    )}
                </div>

                {/* Price */}
                <div>
                    <label htmlFor="price" className="text-md font-semibold text-text-secondary">
                        {t('price')}
                        <span className="ml-2 text-xs font-normal text-text-muted">
                            {t('optional')}
                        </span>
                    </label>
                    <div className={`
                        flex items-center rounded-lg border bg-bg
                        ${errors.price ? 'border-error ring-1 ring-error' : 'border-border'}
                    `}>
                        <span className="px-3 py-2 text-sm text-text-muted bg-bg-muted border-border">
                            PLN
                        </span>
                        <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        {...register('price', {
                            setValueAs: (value) => value === '' ? undefined : Number(value),
                        })}
                        className="flex-1 px-3 py-2 text-sm bg-bg text-text"
                        placeholder="0.00"
                        />
                    </div>
                    {errors.price && (
                        <p className="flex items-center gap-1 text-xs text-error mt-1">
                            <TriangleAlert className="w-3 h-3" />
                            {errors.price.message}
                        </p>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border">
                    <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 mx-6 bg-primary hover:bg-primary-hover text-text-contrast"
                    >
                        {isSubmitting ? t('creating') : t('submit')}
                    </Button>
                    <Button
                    type="button"
                    variant="ghost"
                    disabled={isSubmitting}
                    onClick={() => router.back()}
                    className="px-6 mx-6"
                    >
                        {t('cancel')}
                    </Button>
                </div>
            </form>
        </div>
        </PageContainer>
    );
}