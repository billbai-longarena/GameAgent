import { NextRequest, NextResponse } from 'next/server';
import { AgentController } from '@/lib/agent/controller';
import { AIService } from '@/services/ai.service';
import { WebSocketService } from '@/services/websocket.service';
import { ThinkingEngine } from '@/lib/agent/thinking';
import { ExecutionEngine } from '@/lib/agent/execution'; // Import ExecutionEngine
import { FileService } from '@/services/file.service'; // Import FileService
import { ProjectService } from '@/services/project.service'; // Assuming project service for project validation

// In-memory store for AgentController instances.
// In a production environment, consider a more robust solution for managing agent instances.
const agentControllers = new Map<string, AgentController>();

// Initialize services (singleton instances)
// These would typically be initialized and managed in a more sophisticated DI container or service locator.
const aiService = new AIService();
const websocketService = new WebSocketService();
const fileService = new FileService(); // Create FileService instance
const thinkingEngine = new ThinkingEngine(aiService, websocketService);
const projectService = new ProjectService();

async function getOrCreateAgentController(projectId: string): Promise<AgentController | null> {
    // Validate project existence (optional but good practice)
    // const project = await projectService.getProjectById(projectId);
    // if (!project) {
    //     console.error(`Project with ID ${projectId} not found.`);
    //     return null;
    // }

    if (!agentControllers.has(projectId)) {
        console.log(`Creating new AgentController for project ${projectId}`);
        // Create ExecutionEngine instance for this specific projectId
        const executionEngine = new ExecutionEngine(projectId, fileService, websocketService);
        // Pass all required engines/services to AgentController constructor
        const controller = new AgentController(projectId, aiService, websocketService, thinkingEngine, executionEngine);
        agentControllers.set(projectId, controller);
    }
    return agentControllers.get(projectId)!;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, action, instruction } = body;

        if (!projectId || !action) {
            return NextResponse.json({ error: 'projectId and action are required' }, { status: 400 });
        }

        const controller = await getOrCreateAgentController(projectId);
        if (!controller) {
            return NextResponse.json({ error: `Agent controller for project ${projectId} could not be initialized (project might not exist).` }, { status: 404 });
        }

        switch (action) {
            case 'start':
                if (!instruction) {
                    return NextResponse.json({ error: 'instruction is required for start action' }, { status: 400 });
                }
                await controller.start(instruction);
                return NextResponse.json({ success: true, message: `Agent for project ${projectId} started.` });
            case 'pause':
                controller.pause();
                return NextResponse.json({ success: true, message: `Agent for project ${projectId} paused.` });
            case 'resume':
                controller.resume();
                return NextResponse.json({ success: true, message: `Agent for project ${projectId} resumed.` });
            case 'stop':
                controller.stop();
                return NextResponse.json({ success: true, message: `Agent for project ${projectId} stopped.` });
            default:
                return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
        }
    } catch (error) {
        console.error('Error in agent control API:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to process agent control request', details: errorMessage }, { status: 500 });
    }
}
