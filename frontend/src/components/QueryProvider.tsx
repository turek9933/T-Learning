'use client';
import { environmentManager, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { get, set, del } from 'idb-keyval';

// Whitelist of query key prefixes that are safe to keep in cache in IDB.
// Excluded: session/auth, chat messages, presigned file URLs.
const PERSISTABLE_KEYS = new Set([
    'workspaces',
    'workspace',
    'posts',
    'feed',
    'materials',
    'events',
    'homeworks',
    'comments',
]);

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // fresh data timeout 2 min
                staleTime: 2 * 60 * 1000,

                // garbage collection timeout 24h — must be >= persister maxAge
                gcTime: 24 * 60 * 60 * 1000,

                // retry 1 time on network error
                retry: 1,
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
    if (environmentManager.isServer()) return makeQueryClient();
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
}

// idb-keyval storage adapter,
// methods match AsyncStorage interface
const idbStorage = {
    getItem: (key: string) => get<string>(key).then((v) => v ?? null),
    setItem: (key: string, value: string) => set(key, value),
    removeItem: (key: string) => del(key),
};

const persister = createAsyncStoragePersister({
    storage: idbStorage,
    key: 't-learning-query-cache',
    throttleTime: 1000,
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient();

    return (
        <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
            persister,
            maxAge: 24 * 60 * 60 * 1000,// 24h
            buster: 'v1',// Increase this to invalidate all queries
            dehydrateOptions: {
                // Only dehydrate queries for whitelisted keys
                shouldDehydrateQuery: (query) => {
                    const root = query.queryKey[0];
                    return (
                        typeof root === 'string'
                        && PERSISTABLE_KEYS.has(root)
                        && query.state.status === 'success'
                    );
                },
            },
        }}
        >
            {children}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools
                initialIsOpen={false}
                buttonPosition="bottom-right"
                />
            )}
        </PersistQueryClientProvider>
    );
}