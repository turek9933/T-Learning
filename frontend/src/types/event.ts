export type EventType = 'meeting' | 'deadline' | 'exam';

export type EventItem = {
    type: 'event';
    id: string;
    workspaceId: string;
    eventType: EventType;
    title: string;
    description: string | null;
    location: string | null;
    startsAt: string;
    endsAt: string | null;
    createdAt: string;
    updatedAt: string;
    userId: string;
    userName: string | null;
    userAvatar: string | null;
};

export type UpcomingEvent = {
    id: string;
    type: EventType;
    title: string;
    startsAt: string;
    endsAt: string | null;
    location: string | null;
};
