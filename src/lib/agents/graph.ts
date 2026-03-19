import { END, START, Annotation, StateGraph } from '@langchain/langgraph';
import type { AgentMemoryStore } from '@/lib/agents/memoryStore';

const OrchestrationState = Annotation.Root({
    userId: Annotation<string>,
    taskId: Annotation<string>,
    toolName: Annotation<string>,
    fromState: Annotation<string>,
    toState: Annotation<string>,
    notes: Annotation<string | undefined>,
});

export async function runTransitionGraph(input: {
    userId: string;
    taskId: string;
    toolName: string;
    memoryStore: AgentMemoryStore;
    notes?: string;
}): Promise<void> {
    const graph = new StateGraph(OrchestrationState)
        .addNode('started', async (state) => {
            await input.memoryStore.logTransition({
                userId: state.userId,
                taskId: state.taskId,
                fromState: 'queued',
                toState: 'in_progress',
                node: 'started',
                notes: state.notes,
            });

            return { ...state, fromState: 'queued', toState: 'in_progress' };
        })
        .addNode('completed', async (state) => {
            await input.memoryStore.logTransition({
                userId: state.userId,
                taskId: state.taskId,
                fromState: 'in_progress',
                toState: 'completed',
                node: `${state.toolName}:completed`,
                notes: state.notes,
            });

            return { ...state, fromState: 'in_progress', toState: 'completed' };
        })
        .addEdge(START, 'started')
        .addEdge('started', 'completed')
        .addEdge('completed', END)
        .compile();

    await graph.invoke({
        userId: input.userId,
        taskId: input.taskId,
        toolName: input.toolName,
        fromState: 'queued',
        toState: 'completed',
        notes: input.notes,
    });
}
