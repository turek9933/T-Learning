import { HomeworkItem } from './homework';
import { EventItem } from './event';
import { PostItem } from './post';

export type FeedItem = PostItem | EventItem | HomeworkItem;