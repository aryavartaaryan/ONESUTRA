import type { Firestore, Timestamp } from 'firebase-admin/firestore';

export type LifeGoalCategory = 'Health' | 'Wealth' | 'Spiritual' | 'Work';

export type SakhaTone = 'neutral' | 'calming' | 'motivational' | 'focused';

export interface SakhaRuntimeConfig {
    geminiApiKey?: string;
    firestore?: Firestore;
}

export interface EmotionalToneResult {
    stressScore: number;
    dominantEmotion: 'stressed' | 'calm' | 'focused' | 'excited' | 'neutral';
    suggestedTone: SakhaTone;
    promptDirective: string;
}

export interface ConversationTurn {
    role: 'user' | 'assistant' | 'system' | 'tool';
    text: string;
    createdAt: number;
}

export interface SakhaConversationState {
    userId: string;
    conversationId: string;
    lifeGoal: LifeGoalCategory;
    stressScore: number;
    tone: SakhaTone;
    history: ConversationTurn[];
}

export interface DharmaTaskDocument {
    id: string;
    userId: string;
    title: string;
    description?: string;
    lifeGoal: LifeGoalCategory;
    status: 'queued' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    source: 'sakha_bodhi';
    toolName?: string;
    metadata?: Record<string, unknown>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface AgentTransitionDocument {
    userId: string;
    taskId: string;
    fromState: string;
    toState: string;
    node: string;
    notes?: string;
    createdAt: Timestamp;
}

export interface BrahmastraRequest {
    userId: string;
    reason?: string;
    minutes?: number;
    dryRun?: boolean;
}

export interface CalendarEventDocument {
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    essential?: boolean;
    priorityScore?: number;
    status?: 'scheduled' | 'cancelled' | 'reschedule_proposed' | 'completed';
}

export interface BrahmastraResult {
    activated: boolean;
    focusWindowMinutes: number;
    cancelledOrRescheduledCount: number;
    impactedMeetingIds: string[];
    userStatePath: string;
    summary: string;
}

export interface MorningBriefingRequest {
    userId: string;
    maxEmails?: number;
}

export interface MorningBriefingResult {
    summary: string;
    topItems: Array<{
        id: string;
        subject: string;
        priority: 'high' | 'medium' | 'low';
        snippet: string;
    }>;
}

export interface WebTravelAgentRequest {
    userId: string;
    source: string;
    destination: string;
    date: string;
}

export interface WebTravelAgentResult {
    provider: 'Yatra' | 'IRCTC' | 'unavailable';
    payNowLink: string | null;
    notes: string;
}

export interface EcomAssistantRequest {
    userId: string;
    query: string;
}

export interface EcomAssistantResult {
    topChoices: Array<{
        title: string;
        rating: number;
        priceText: string;
        productUrl: string;
    }>;
    selectedChoiceIndex: number;
    cartAction: 'added' | 'simulated';
    notes: string;
}

export interface GitHubManagerRequest {
    userId: string;
    owner: string;
    repo: string;
    maxPulls?: number;
}

export interface GitHubManagerResult {
    openPullRequests: Array<{
        number: number;
        title: string;
        author: string;
        url: string;
        suggestedReview: string;
    }>;
    summary: string;
}

export interface SocialMediaAutopilotRequest {
    userId: string;
    projectUpdate: string;
    platform?: 'linkedin' | 'twitter' | 'both';
}

export interface SocialMediaAutopilotResult {
    linkedinPost?: string;
    twitterPost?: string;
    visualDirection: string;
}

export interface ToolExecutionContext {
    userId: string;
    tone: SakhaTone;
    stressScore: number;
    lifeGoal: LifeGoalCategory;
}

export type AgentTool<TArgs = unknown, TResult = unknown> = {
    name: string;
    description: string;
    execute: (args: TArgs, ctx: ToolExecutionContext) => Promise<TResult>;
};
