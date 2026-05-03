import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserSearch } from '@/lib/queries/users';
import { authClient } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import { customToast } from '@/lib/customToast';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Search, X, UserPlus } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';

type UserSearchProps = {
    onSelect: (user: { id: string; name: string; email: string }) => void
    actionLabel: string
    actionIcon?: React.ReactNode
}

export function UserSearch({onSelect, actionLabel, actionIcon}: UserSearchProps) {
    const t = useTranslations('components.search');
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const { data: results = [], isFetching } = useUserSearch(search);

    class AuthError extends Error {
        code?: string;

        constructor(message: string | undefined, code?: string) {
            super(message);
            this.code = code;
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col w-full max-w-lg items-center space-y-4">
                <InputGroup>
                    <InputGroupInput
                    id="search"
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full font-normal"
                    />
                    <InputGroupAddon>
                        <Search className='w-4 h-4 text-text-secondary' />
                    </InputGroupAddon>
                    {search && (
                        <InputGroupButton
                        type="button"
                        variant="ghost"
                        onClick={() => setSearch('')}
                        >
                            <X className="w-4 h-4" />
                        </InputGroupButton>
                    )}
                </InputGroup>
            </div>
            {search.length > 2 && (
                <div className="flex flex-col w-full max-w-lg items-center space-y-4">
                    {isFetching && results.length === 0  && (
                        <p className="text-sm text-text-secondary">{t('searchLoading')}</p>
                    )}
                    {!isFetching && results.length === 0  && (
                        <p className="text-sm text-text-secondary">{t('searchNotFound')}</p>
                    )}
                    { results.length > 0 &&
                        <div className="flex flex-col items-center justify-between border border-border rounded-lg">
                            {results.map((result) => (
                                <div key={result.id} className="flex flex-col w-full items-center space-y-4 px-4 py-2">
                                    <div className="flex w-full items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Avatar {...result} />
                                            <p className="font-semibold">{result.name}</p>
                                            <p className="font-normal text-text-secondary text-sm">{result.email}</p>
                                        </div>
                                        <Button
                                        type="button"
                                        variant="ghost"
                                        className="border"
                                        onClick={() => onSelect(result)}
                                        >
                                            {actionIcon}
                                            {actionLabel}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            )}
        </div>
    );
}