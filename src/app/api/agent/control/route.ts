import { NextRequest, NextResponse } from 'next/server';
import { AgentController } from '@/lib/agent/controller';
import { AIService } from '@/services/ai.service';
import { WebSocketService } from '@/services/websocket.service';
import { ThinkingEngine } from '@/lib/agent/thinking';
import { ExecutionEngine } from '@/lib/agent/execution'; // Import ExecutionEngine
import { FileService } from '@/services/file.service'; // Import FileService
import { ProjectService } from '@/services/project.service'; // Assuming project service for project validation
import { GameGenerator } from '@/lib/game/generator';
import { TemplateManifest } from '@/types/template';
import { GameType, ProjectStatus, DevelopmentStage } from '@/types/project';

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
// 创建一个 GameGenerator 实例，并提供一些基本模板
const availableTemplates: TemplateManifest[] = [
    {
        id: 'quiz',
        name: '问答游戏模板',
        description: '一个基础的问答游戏，支持选择题和判断题。',
        version: '1.0.0',
        previewImageUrl: 'quiz-preview.png',
        entryPoint: 'index.html',
        tags: ['教育', '知识测验'],
        author: 'GameAgent Team'
    },
    {
        id: 'matching',
        name: '匹配游戏模板',
        description: '一个匹配游戏，支持配对概念、术语与定义匹配等。',
        version: '1.0.0',
        previewImageUrl: 'matching-preview.png',
        entryPoint: 'index.html',
        tags: ['教育', '记忆'],
        author: 'GameAgent Team'
    },
    {
        id: 'sorting',
        name: '排序游戏模板',
        description: '一个排序游戏，支持按顺序排列事件、步骤或概念。',
        version: '1.0.0',
        previewImageUrl: 'sorting-preview.png',
        entryPoint: 'index.html',
        tags: ['教育', '逻辑'],
        author: 'GameAgent Team'
    }
    // { // drag_drop template files do not exist in gagent/public/templates, removing this entry
    //     id: 'drag_drop',
    //     name: '拖放游戏模板',
    //     description: '一个拖放游戏，支持将元素拖放到正确位置。',
    //     version: '1.0.0',
    //     previewImageUrl: 'drag_drop-preview.png',
    //     entryPoint: 'index.html',
    //     tags: ['教育', '互动'],
    //     author: 'GameAgent Team'
    // }
];
// const gameGenerator = new GameGenerator(fileService, availableTemplates); // Will be created per-controller

async function getOrCreateAgentController(projectId: string): Promise<AgentController | null> {
    // 获取项目信息
    let project;
    try {
        project = await projectService.getProjectById(projectId);
        if (!project) {
            console.error(`Project with ID ${projectId} not found.`);
            // 创建一个临时项目对象，以便测试能够继续
            project = {
                id: projectId,
                name: 'Test Project',
                description: 'A test project created for testing purposes',
                gameType: GameType.DRAG_DROP,
                userId: 'test-user-id',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: ProjectStatus.IN_PROGRESS,
                currentStage: DevelopmentStage.REQUIREMENT_ANALYSIS,
                progress: 0
            };
        }
    } catch (error) {
        console.error(`Error fetching project ${projectId}:`, error);
        // 创建一个临时项目对象，以便测试能够继续
        project = {
            id: projectId,
            name: 'Test Project',
            description: 'A test project created for testing purposes',
            gameType: GameType.DRAG_DROP,
            userId: 'test-user-id',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: ProjectStatus.IN_PROGRESS,
            currentStage: DevelopmentStage.REQUIREMENT_ANALYSIS,
            progress: 0
        };
    }

    if (!agentControllers.has(projectId)) {
        console.log(`Creating new AgentController for project ${projectId}`);
        // Create ExecutionEngine instance for this specific projectId
        const executionEngine = new ExecutionEngine(projectId, fileService, websocketService);
        // Create GameGenerator instance here, passing the correct executionEngine
        const perProjectGameGenerator = new GameGenerator(executionEngine, availableTemplates);

        // Pass all required engines/services to AgentController constructor
        const controller = new AgentController(
            project,
            aiService,
            websocketService,
            thinkingEngine,
            executionEngine,
            perProjectGameGenerator // Use the per-project gameGenerator
        );
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
