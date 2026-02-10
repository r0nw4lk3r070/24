export interface User {
    id: string;
    username: string;
    uniqueId: string;
    createdAt: Date;
}

export interface Message {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
    isEmoji: boolean;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    deliveredAt?: Date;
    readAt?: Date;
}

export interface GroupChat {
    id: string;
    name: string;
    members: User[];
    messages: Message[];
}