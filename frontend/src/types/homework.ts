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

export type MyHomework = {
    id: string;
    title: string;
    dueAt: string | null;
    workspaceId: string;
    workspaceName: string;
    workspaceSlug: string;
    submittedAt: string | null;
};

export type HomeworkAttachment = {
    id: string;
    homeworkId: string;
    storageKey: string;
    name: string;
    mimeType: string;
    size: number;
    createdAt: string;
};

export type HomeworkDetail = {
    id: string;
    workspaceId: string;
    userId: string;
    title: string;
    description: string | null;
    dueAt: string | null;
    createdAt: string;
    updatedAt: string;
    attachments: HomeworkAttachment[];
};

export type SubmissionAttachment = {
    id: string;
    submissionId: string;
    storageKey: string;
    name: string;
    mimeType: string;
    size: number;
    createdAt: string;
};

export type Submission = {
    id: string;
    homeworkId: string;
    userId: string;
    userName: string | null;
    userAvatar: string | null;
    content: string | null;
    submittedAt: string;
    updatedAt: string;
    attachments: SubmissionAttachment[];
};