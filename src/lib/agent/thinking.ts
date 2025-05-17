import { AIService } from '@/services/ai.service';
import { WebSocketService } from '@/services/websocket.service'; // To emit thinking steps
import { AgentAction, ActionType, DevelopmentStage, LogLevel } from '@/types/agent';

// Define interfaces for the structured thinking process

export enum TaskType {
    ANALYZE_REQUIREMENTS = 'analyze_requirements',
    GENERATE_WORK_PLAN = 'generate_work_plan',
    CREATE_FILE = 'create_file',
    MODIFY_FILE = 'modify_file',
    DELETE_FILE = 'delete_file',
    GENERATE_GAME_CODE = 'generate_game_code',
    CUSTOMIZE_GAME_ASSETS = 'customize_game_assets',
    RUN_TESTS = 'run_tests',
    DEBUG_CODE = 'debug_code',
    REVIEW_CODE = 'review_code',
    OTHER = 'other',
}
export interface RequirementAnalysis {
    originalInstruction: string;
    parsedRequirements: string[];
    constraints: string[];
    goals: string[];
    clarificationsNeeded?: string[]; // Questions to ask the user if ambiguity exists
    details?: any; // For game-specific details like questions, items, etc.
}

export interface WorkPlanStep {
    id: string;
    description: string;
    type: TaskType; // Type of task for this step
    estimatedTime?: number; // in seconds
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    details?: string; // More detailed explanation or sub-steps
    relatedFiles?: string[]; // Files this step will affect
}

export interface WorkPlan {
    id: string;
    projectId: string;
    overallGoal: string;
    steps: WorkPlanStep[];
    currentStepIndex: number;
}

export interface ProblemDetails {
    description: string;
    context?: any;
    possibleCauses?: string[];
}

export interface SolutionProposal {
    problemId: string;
    proposedSolution: string;
    reasoning: string;
    estimatedEffort?: string; // e.g., "low", "medium", "high"
    confidenceScore?: number; // 0-1
}

export class ThinkingEngine {
    private aiService: AIService;
    private websocketService: WebSocketService; // To emit thinking updates

    constructor(aiService: AIService, websocketService: WebSocketService) {
        this.aiService = aiService;
        this.websocketService = websocketService;
    }

    // 辅助函数，发送日志到前端
    private sendLog(projectId: string, message: string, level: LogLevel = LogLevel.INFO, context?: any): void {
        this.websocketService.sendAgentLog(projectId, {
            id: crypto.randomUUID(),
            message: `ThinkingEngine: ${message}`,
            level,
            timestamp: new Date(),
            context
        });
    }

    private emitThinkingUpdate(projectId: string, thinkingMessage: string, action?: AgentAction): void {
        this.websocketService.sendAgentThinking(projectId, thinkingMessage);
        if (action) {
            this.websocketService.sendAgentAction(projectId, action);
        }
        // 发送日志到前端
        this.sendLog(projectId, thinkingMessage);
    }

    /**
     * Analyzes the user's natural language instruction to understand requirements.
     * @param projectId The ID of the project.
     * @param instruction The user's instruction.
     * @returns A structured analysis of the requirements.
     */
    public async analyzeRequirement(projectId: string, instruction: string): Promise<RequirementAnalysis> {
        this.sendLog(projectId, `Analyzing requirement >>>\n${instruction}\n<<< END REQUIREMENT`);
        this.emitThinkingUpdate(projectId, `Analyzing instruction: "${instruction}"`);

        // TODO: Implement actual AI call to parse instruction
        // This is a placeholder implementation.
        const analysis: RequirementAnalysis = {
            originalInstruction: instruction,
            parsedRequirements: [`Generate a game based on: "${instruction}"`],
            constraints: ["Use Next.js and TypeScript"],
            goals: ["Create a functional and engaging game"],
        };

        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (instruction.toLowerCase().includes("complex")) {
            analysis.clarificationsNeeded = ["Could you specify what 'complex' entails? e.g., number of levels, specific mechanics."];
            this.emitThinkingUpdate(projectId, "Instruction seems to mention complexity, clarification might be needed.");
        }

        this.sendLog(projectId, `Analysis result:`, LogLevel.INFO, analysis);
        this.emitThinkingUpdate(projectId, "Requirement analysis complete.", {
            type: ActionType.ANALYZE,
            description: "Completed requirement analysis",
            details: analysis,
            timestamp: new Date(),
        });
        return analysis;
    }

    /**
     * Generates a work plan based on the requirement analysis.
     * @param projectId The ID of the project.
     * @param analysis The result of the requirement analysis.
     * @returns A structured work plan.
     */
    public async generateWorkPlan(projectId: string, analysis: RequirementAnalysis): Promise<WorkPlan> {
        this.sendLog(projectId, `Generating work plan for goals:`, LogLevel.INFO, analysis.goals);
        this.emitThinkingUpdate(projectId, `Generating work plan for: ${analysis.goals.join(', ')}`);

        // TODO: Implement actual AI call to generate a work plan
        // This is a placeholder implementation.
        const plan: WorkPlan = {
            id: crypto.randomUUID(),
            projectId,
            overallGoal: analysis.goals.join('; '),
            steps: [
                { id: crypto.randomUUID(), description: "Setup project structure", type: TaskType.CREATE_FILE, status: 'pending', estimatedTime: 300 },
                { id: crypto.randomUUID(), description: "Generate game assets and initial code", type: TaskType.GENERATE_GAME_CODE, status: 'pending', estimatedTime: 1200 },
                { id: crypto.randomUUID(), description: "Develop core game logic", type: TaskType.MODIFY_FILE, status: 'pending', estimatedTime: 1200 },
                { id: crypto.randomUUID(), description: "Create UI components", type: TaskType.CREATE_FILE, status: 'pending', estimatedTime: 900 },
                { id: crypto.randomUUID(), description: "Implement scoring and levels", type: TaskType.MODIFY_FILE, status: 'pending', estimatedTime: 600 },
                { id: crypto.randomUUID(), description: "Test and debug", type: TaskType.RUN_TESTS, status: 'pending', estimatedTime: 700 },
                { id: crypto.randomUUID(), description: "Final review and optimization", type: TaskType.REVIEW_CODE, status: 'pending', estimatedTime: 400 },
            ],
            currentStepIndex: 0,
        };

        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        this.sendLog(projectId, `Generated work plan:`, LogLevel.INFO, plan);
        this.emitThinkingUpdate(projectId, "Work plan generated.", {
            type: ActionType.ANALYZE, // Or a new ActionType like PLAN_GENERATED
            description: "Generated work plan",
            details: plan,
            timestamp: new Date(),
        });
        return plan;
    }

    /**
     * Proposes a solution for a given problem.
     * @param projectId The ID of the project.
     * @param problem The problem details.
     * @returns A proposed solution.
     */
    public async proposeSolution(projectId: string, problem: ProblemDetails): Promise<SolutionProposal> {
        this.sendLog(projectId, `Proposing solution for problem:`, LogLevel.INFO, problem);
        this.emitThinkingUpdate(projectId, `Thinking about a solution for problem: "${problem.description}"`);

        // TODO: Implement AI call to generate a solution proposal
        const proposal: SolutionProposal = {
            problemId: crypto.randomUUID(),
            proposedSolution: "Refactor the problematic module and add more unit tests.",
            reasoning: "The module seems to have high complexity and low test coverage, leading to potential bugs.",
            estimatedEffort: "medium",
            confidenceScore: 0.75,
        };
        await new Promise(resolve => setTimeout(resolve, 1800));

        this.sendLog(projectId, `Proposed solution:`, LogLevel.INFO, proposal);
        this.emitThinkingUpdate(projectId, "Solution proposed.", {
            type: ActionType.ANALYZE, // Or a new ActionType like SOLUTION_PROPOSED
            description: "Proposed a solution",
            details: proposal,
            timestamp: new Date(),
        });
        return proposal;
    }

    // Further methods for decision making, code evaluation, etc., can be added here.
}
