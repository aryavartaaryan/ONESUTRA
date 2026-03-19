import { GoogleGenAI } from '@google/genai';
import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { AgentMemoryStore } from '@/lib/agents/memoryStore';
import { runTransitionGraph } from '@/lib/agents/graph';
import { brahmastraModeTool } from '@/lib/agents/tools/brahmastraMode';
import { morningBriefingTool } from '@/lib/agents/tools/morningBriefing';
import { webTravelAgentTool } from '@/lib/agents/tools/webTravelAgent';
import { ecomAssistantTool } from '@/lib/agents/tools/ecomAssistant';
import { githubManagerTool } from '@/lib/agents/tools/githubManager';
import { socialMediaAutopilotTool } from '@/lib/agents/tools/socialMediaAutopilot';
import type {
    AgentTool,
    BrahmastraRequest,
    BrahmastraResult,
    ConversationTurn,
    EcomAssistantRequest,
    EcomAssistantResult,
    EmotionalToneResult,
    GitHubManagerRequest,
    GitHubManagerResult,
    LifeGoalCategory,
    MorningBriefingRequest,
    MorningBriefingResult,
    SakhaConversationState,
    SakhaRuntimeConfig,
    ToolExecutionContext,
    SocialMediaAutopilotRequest,
    SocialMediaAutopilotResult,
    WebTravelAgentRequest,
    WebTravelAgentResult,
} from '@/lib/agents/types';

type RegisteredTools = {
    brahmastra_mode: AgentTool<BrahmastraRequest, BrahmastraResult>;
    morning_briefing: AgentTool<MorningBriefingRequest, MorningBriefingResult>;
    web_travel_agent: AgentTool<WebTravelAgentRequest, WebTravelAgentResult>;
    ecom_assistant: AgentTool<EcomAssistantRequest, EcomAssistantResult>;
    github_manager: AgentTool<GitHubManagerRequest, GitHubManagerResult>;
    social_media_autopilot: AgentTool<SocialMediaAutopilotRequest, SocialMediaAutopilotResult>;
};

export class SakhaBodhi {
    private static instance: SakhaBodhi | null = null;

    private readonly db: Firestore;
    private readonly ai?: GoogleGenAI;
    private readonly memoryStore: AgentMemoryStore;
    private readonly conversations = new Map<string, SakhaConversationState>();
    private readonly tools: RegisteredTools;

    private constructor(config: SakhaRuntimeConfig = {}) {
        this.db = config.firestore ?? getAdminDb();
        this.ai = config.geminiApiKey ? new GoogleGenAI({ apiKey: config.geminiApiKey }) : undefined;
        this.memoryStore = new AgentMemoryStore(this.db);

        this.tools = {
            brahmastra_mode: {
                name: 'brahmastra_mode',
                description:
                    'Scans user calendar, triages non-essential meetings, and enables deep focus mode with interruption shield.',
                execute: async (args, ctx) => brahmastraModeTool(this.db, args, ctx),
            },
            morning_briefing: {
                name: 'morning_briefing',
                description:
                    'Prioritizes unread Gmail items using Firestore-backed context and generates a conversational morning brief.',
                execute: async (args, ctx) => morningBriefingTool(this.db, args, ctx),
            },
            web_travel_agent: {
                name: 'web_travel_agent',
                description:
                    'Runs browser-travel workflow and returns a Pay Now link candidate for booking confirmation.',
                execute: async (args, ctx) => webTravelAgentTool(args, ctx),
            },
            ecom_assistant: {
                name: 'ecom_assistant',
                description:
                    'Finds top-rated e-commerce choices and prepares best option for cart action.',
                execute: async (args, ctx) => ecomAssistantTool(args, ctx),
            },
            github_manager: {
                name: 'github_manager',
                description:
                    'Lists open pull requests and suggests focused code reviews based on user coding style profile.',
                execute: async (args, ctx) => githubManagerTool(this.db, args, ctx),
            },
            social_media_autopilot: {
                name: 'social_media_autopilot',
                description:
                    'Converts project updates into high-vibe LinkedIn and Twitter drafts with spiritual-tech style direction.',
                execute: async (args, ctx) => socialMediaAutopilotTool(args, ctx),
            },
        };
    }

    static getInstance(config?: SakhaRuntimeConfig): SakhaBodhi {
        if (!SakhaBodhi.instance) {
            SakhaBodhi.instance = new SakhaBodhi(config);
        }

        return SakhaBodhi.instance;
    }

    getFirestore(): Firestore {
        return this.db;
    }

    getModelClient(): GoogleGenAI | undefined {
        return this.ai;
    }

    getConversationState(userId: string, lifeGoal: LifeGoalCategory = 'Work'): SakhaConversationState {
        const existing = this.conversations.get(userId);
        if (existing) return existing;

        const state: SakhaConversationState = {
            userId,
            conversationId: `sakha-${userId}-${Date.now()}`,
            lifeGoal,
            stressScore: 0.2,
            tone: 'neutral',
            history: [],
        };
        this.conversations.set(userId, state);
        return state;
    }

    appendConversationTurn(userId: string, turn: ConversationTurn): SakhaConversationState {
        const state = this.getConversationState(userId);
        state.history = [...state.history.slice(-39), turn];
        this.conversations.set(userId, state);
        return state;
    }

    analyzeEmotion(input: string): EmotionalToneResult {
        const text = input.toLowerCase();
        const stressLexicon = [
            'panic',
            'overwhelmed',
            'anxious',
            'stressed',
            'burnout',
            'deadline',
            'pressure',
            'tired',
        ];

        const stressHits = stressLexicon.reduce((count, token) => count + (text.includes(token) ? 1 : 0), 0);
        const stressScore = Math.min(1, stressHits * 0.22 + (text.length > 260 ? 0.15 : 0));

        if (stressScore > 0.8) {
            return {
                stressScore,
                dominantEmotion: 'stressed',
                suggestedTone: 'calming',
                promptDirective:
                    'Shift to calming and meditative guidance. Keep responses soft, reassuring, and suggest a 5-minute breathing exercise.',
            };
        }

        if (stressScore > 0.45) {
            return {
                stressScore,
                dominantEmotion: 'focused',
                suggestedTone: 'focused',
                promptDirective:
                    'Use clear and concise guidance with grounded reassurance. Keep momentum while avoiding extra pressure.',
            };
        }

        return {
            stressScore,
            dominantEmotion: 'calm',
            suggestedTone: 'neutral',
            promptDirective: 'Use warm, practical, and lightly spiritual tone.',
        };
    }

    async createLifeGoalTask(input: {
        userId: string;
        title: string;
        description?: string;
        lifeGoal: LifeGoalCategory;
        toolName?: string;
        metadata?: Record<string, unknown>;
    }) {
        return this.memoryStore.createDharmaTask(input);
    }

    async routeTool<K extends keyof RegisteredTools>(params: {
        toolName: K;
        args: Parameters<RegisteredTools[K]['execute']>[0];
        ctx: ToolExecutionContext;
    }): Promise<Awaited<ReturnType<RegisteredTools[K]['execute']>>> {
        const tool = this.tools[params.toolName];
        if (!tool) {
            throw new Error(`Unsupported tool: ${String(params.toolName)}`);
        }

        const task = await this.createLifeGoalTask({
            userId: params.ctx.userId,
            title: `${tool.name} execution`,
            description: tool.description,
            lifeGoal: params.ctx.lifeGoal,
            toolName: tool.name,
            metadata: {
                stressScore: params.ctx.stressScore,
                tone: params.ctx.tone,
            },
        });

        await this.memoryStore.updateTaskStatus({
            userId: params.ctx.userId,
            taskId: task.id,
            status: 'in_progress',
        });

        const result = await tool.execute(params.args, params.ctx);

        await this.memoryStore.updateTaskStatus({
            userId: params.ctx.userId,
            taskId: task.id,
            status: 'completed',
            metadata: {
                result,
            },
        });

        await runTransitionGraph({
            userId: params.ctx.userId,
            taskId: task.id,
            toolName: tool.name,
            memoryStore: this.memoryStore,
            notes: 'LangGraph transition log for OneSUTRA orchestration',
        });

        return result as Awaited<ReturnType<RegisteredTools[K]['execute']>>;
    }
}

export function getSakhaBodhi(config?: SakhaRuntimeConfig): SakhaBodhi {
    return SakhaBodhi.getInstance(config ?? { geminiApiKey: process.env.GEMINI_API_KEY });
}
