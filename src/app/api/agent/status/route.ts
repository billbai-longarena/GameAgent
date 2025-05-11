import { NextRequest, NextResponse } from 'next/server';
import { AgentController } from '@/lib/agent/controller';
import { AIService } from '@/services/ai.service';
import { WebSocketService } from '@/services/websocket.service';
import { ThinkingEngine } from '@/lib/agent/thinking';
import { ExecutionEngine } from '@/lib/agent/execution'; // Import ExecutionEngine
import { FileService } from '@/services/file.service'; // Import FileService

// This Map should be shared with control/route.ts or managed globally.
// For simplicity in this example, we are redeclaring it, but in a real app,
// this state needs to be consistently managed.
// A better approach would be a singleton service managing agent controllers.
const agentControllers = new Map<string, AgentController>();

// Initialize services (singleton instances)
// Duplicated from control/route.ts - ideally, these are managed globally.
const aiService = new AIService();
const websocketService = new WebSocketService();
const fileService = new FileService(); // Create FileService instance
const thinkingEngine = new ThinkingEngine(aiService, websocketService);

// Function to get or create controller (duplicated for now, should be refactored)
// This is NOT ideal. AgentController instances should be managed in a single place.
// This is a temporary measure to make this route functional independently for now.
// TODO: Refactor AgentController instance management to a shared service/module.
function getOrCreateAgentController(projectId: string): AgentController {
    if (!agentControllers.has(projectId)) {
        console.log(`Creating new AgentController for project ${projectId} (from status route)`);
        // Create ExecutionEngine instance for this specific projectId
        const executionEngine = new ExecutionEngine(projectId, fileService, websocketService);
        // Pass all required engines/services to AgentController constructor
        const controller = new AgentController(projectId, aiService, websocketService, thinkingEngine, executionEngine);
        agentControllers.set(projectId, controller);
    }
    return agentControllers.get(projectId)!;
}


export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: 'projectId is required as a query parameter' }, { status: 400 });
    }

    // In a real application, you would likely fetch an existing controller.
    // If a controller might not exist yet for a project until it's interacted with via POST /control,
    // then this route might return a default "idle" or "not found" state.
    // For now, we use getOrCreate to ensure a controller (and thus a state) always exists for a queried project.
    // This behavior might need adjustment based on product requirements.
    const controller = getOrCreateAgentController(projectId);

    if (!controller) {
        // This case should ideally not be hit if getOrCreateAgentController always creates one.
        // However, if project validation was added and failed, it could.
        return NextResponse.json({ error: `Agent controller for project ${projectId} not found.` }, { status: 404 });
    }

    try {
        const agentState = controller.getState();
        return NextResponse.json(agentState);
    } catch (error) {
        console.error(`Error fetching agent status for project ${projectId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to fetch agent status', details: errorMessage }, { status: 500 });
    }
}
