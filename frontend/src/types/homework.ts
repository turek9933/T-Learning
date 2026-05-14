export type HomeworkItem = {
    type: 'homework';
    id: string;
    workspaceId: string;
    title: string;
    description: string | null;
    dueAt: string | null;
    createdAt: string;
    updatedAt: string;
    userId: string;
    userName: string | null;
    userAvatar: string | null;
};

export type UpcomingHomework = {
    id: string;
    title: string;
    dueAt: string | null;
    submittedAt: string | null;
};