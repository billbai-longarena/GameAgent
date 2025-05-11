import { AIService } from '@/services/ai.service';
import { WebSocketService } from '@/services/websocket.service';
import { AgentState, AgentStatus, DevelopmentStage, AgentLog, LogLevel, ActionType } from '@/types/agent';
import { ThinkingEngine, RequirementAnalysis, WorkPlan } from './thinking';
import { ExecutionEngine } from './execution'; // Import ExecutionEngine
import { FileService } from '@/services/file.service'; // Needed for ExecutionEngine

export class AgentController {
    private projectId: string;
    private aiService: AIService;
    private websocketService: WebSocketService;
    private thinkingEngine: ThinkingEngine;
    private executionEngine: ExecutionEngine;
    private state: AgentState;
    private currentWorkPlan: WorkPlan | null = null;

    constructor(
        projectId: string,
        aiService: AIService,
        websocketService: WebSocketService,
        thinkingEngine: ThinkingEngine,
        executionEngine: ExecutionEngine // Add executionEngine
    ) {
        this.projectId = projectId;
        this.aiService = aiService;
        this.websocketService = websocketService;
        this.thinkingEngine = thinkingEngine;
        this.executionEngine = executionEngine; // Initialize executionEngine
        this.state = this.initializeState();
        this.emitStateUpdate();
    }

    private initializeState(): AgentState {
        return {
            id: this.projectId, // Assuming agentId is the same as projectId for now
            projectId: this.projectId,
            currentTask: 'Initializing Agent',
            thinking: 'Agent is initializing...',
            action: {
                type: ActionType.INITIALIZE,
                description: 'Agent initialization',
                timestamp: new Date(),
            },
            stage: DevelopmentStage.REQUIREMENT_ANALYSIS,
            progress: 0,
            status: AgentStatus.IDLE,
            logs: [{
                id: crypto.randomUUID(),
                message: 'Agent initialized',
                level: LogLevel.INFO, // Use Enum
                timestamp: new Date(),
            }],
            estimatedTimeRemaining: 0,
        };
    }

    private emitStateUpdate(): void {
        console.log(`Agent state updated for project ${this.projectId}:`, this.state);
        this.websocketService.sendAgentState(this.projectId, this.state);
    }

    public async start(instruction: string): Promise<void> {
        if (this.state.status === AgentStatus.IDLE || this.state.status === AgentStatus.PAUSED || this.state.status === AgentStatus.COMPLETED) {
            console.log(`Agent starting for project ${this.projectId} with instruction: "${instruction}"`);
            this.state.status = AgentStatus.THINKING;
            this.state.currentTask = `Processing instruction: ${instruction}`;
            this.state.thinking = `Understanding instruction: "${instruction}"`;
            this.state.action = { type: ActionType.USER_INPUT, description: `Start instruction: ${instruction}`, timestamp: new Date() };
            this.addLog('Agent started processing instruction.', LogLevel.INFO);
            this.emitStateUpdate(); // Emit initial "processing" state

            try {
                // Step 1: Analyze Requirement
                this.state.stage = DevelopmentStage.REQUIREMENT_ANALYSIS;
                this.emitStateUpdate();
                const analysis: RequirementAnalysis = await this.thinkingEngine.analyzeRequirement(this.projectId, instruction);
                this.state.thinking = `Requirement Analysis: ${analysis.goals.join(', ')}`;
                if (analysis.clarificationsNeeded && analysis.clarificationsNeeded.length > 0) {
                    this.state.thinking += `\nClarifications needed: ${analysis.clarificationsNeeded.join('; ')}`;
                    this.addLog(`Clarification needed: ${analysis.clarificationsNeeded.join('; ')}`, LogLevel.INFO);
                    // TODO: Implement a way to pause and ask user for clarification
                    this.state.status = AgentStatus.PAUSED; // Pause if clarification is needed
                    this.emitStateUpdate();
                    return;
                }
                this.addLog('Requirement analysis complete.', LogLevel.INFO);
                this.emitStateUpdate();

                // Step 2: Generate Work Plan
                this.state.stage = DevelopmentStage.DESIGN; // Assuming planning is part of design
                this.state.thinking = 'Generating work plan...';
                this.emitStateUpdate();
                const plan: WorkPlan = await this.thinkingEngine.generateWorkPlan(this.projectId, analysis);
                this.currentWorkPlan = plan;
                this.state.thinking = `Work Plan Generated: ${plan.steps.length} steps. First step: ${plan.steps[0]?.description}`;
                this.addLog(`Work plan generated with ${plan.steps.length} steps.`, LogLevel.INFO);
                this.emitStateUpdate();

                // Step 3: Execute Work Plan
                this.state.stage = DevelopmentStage.CODING; // Or a more specific execution stage
                this.state.thinking = 'Starting work plan execution...';
                this.addLog('Handing off to Execution Engine.', LogLevel.INFO);
                this.emitStateUpdate();

                const executionSuccess = await this.executionEngine.executeWorkPlan(plan);

                if (executionSuccess) {
                    this.state.progress = 100; // Assuming plan completion means 100% for now
                    this.completeTask('Work plan executed successfully.');
                } else {
                    this.state.status = AgentStatus.ERROR;
                    this.state.thinking = 'Work plan execution failed.';
                    this.state.error = { message: 'One or more steps in the work plan failed.' };
                    this.addLog('Work plan execution failed.', LogLevel.ERROR);
                    this.emitStateUpdate();
                }

            } catch (error) {
                console.error(`Error during agent execution for project ${this.projectId}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error during execution.';
                this.state.status = AgentStatus.ERROR;
                this.state.thinking = `Error: ${errorMessage}`;
                this.state.error = { message: errorMessage };
                this.addLog(`Execution error: ${errorMessage}`, LogLevel.ERROR);
                this.emitStateUpdate();
            }
        } else {
            this.addLog('Agent is already running or in an invalid state to start.', LogLevel.WARNING);
            this.emitStateUpdate();
        }
    }

    public pause(): void {
        if (this.state.status === AgentStatus.THINKING || this.state.status === AgentStatus.CODING || this.state.status === AgentStatus.TESTING) {
            this.state.status = AgentStatus.PAUSED;
            const thinkingBeforePause = this.state.thinking;
            this.state.thinking = 'Agent paused by user.';
            this.state.action = { type: ActionType.USER_INPUT, description: 'User paused agent', details: { thinkingBeforePause }, timestamp: new Date() };
            this.addLog('Agent paused.', LogLevel.INFO);
            this.emitStateUpdate();
        } else {
            this.addLog('Agent cannot be paused in its current state.', LogLevel.WARNING);
            this.emitStateUpdate();
        }
    }

    public resume(): void {
        if (this.state.status === AgentStatus.PAUSED) {
            this.state.status = AgentStatus.THINKING; // Default to THINKING, actual task continuation logic needed
            this.state.thinking = 'Agent resumed by user. Re-evaluating current task...';
            this.state.action = { type: ActionType.USER_INPUT, description: 'User resumed agent', timestamp: new Date() };
            this.addLog('Agent resumed.', LogLevel.INFO);
            this.emitStateUpdate();

            // Simulate re-evaluation then continue
            // TODO: This needs more sophisticated logic to truly resume the previous task state
            setTimeout(() => {
                if (this.state.status === AgentStatus.THINKING) {
                    // Potentially re-trigger the part of the task that was interrupted
                    // For now, just a placeholder to restart the 'start' logic if it was the entry point
                    // This is a simplification.
                    console.log("Resuming: Re-triggering a simplified start for demo purposes.");
                    // this.start(this.state.currentTask); // This might not be correct if currentTask was "Processing instruction..."
                }
            }, 1000);
        } else {
            this.addLog('Agent is not paused or cannot be resumed.', LogLevel.WARNING);
            this.emitStateUpdate();
        }
    }

    public stop(): void {
        this.state.status = AgentStatus.IDLE;
        this.state.thinking = 'Agent stopped by user. All tasks cleared.';
        this.state.currentTask = 'Agent stopped.';
        this.state.progress = 0;
        this.state.action = { type: ActionType.USER_INPUT, description: 'User stopped agent', timestamp: new Date() };
        this.addLog('Agent stopped and reset.', LogLevel.INFO);
        this.emitStateUpdate();
        // TODO: Add any cleanup logic here, like clearing timers or stopping ongoing AI calls
    }

    private completeTask(completionMessage: string): void {
        this.state.status = AgentStatus.COMPLETED;
        this.state.thinking = `Task completed: ${completionMessage}`;
        this.state.currentTask = `Completed: ${completionMessage}`;
        this.state.progress = 100;
        this.state.action = { type: ActionType.AGENT_RESPONSE, description: `Task completed: ${completionMessage}`, timestamp: new Date() };
        this.addLog(completionMessage, LogLevel.SUCCESS);
        this.emitStateUpdate();
    }

    public getState(): AgentState {
        return { ...this.state };
    }

    private addLog(message: string, level: LogLevel): void {
        const logEntry: AgentLog = {
            id: crypto.randomUUID(),
            message,
            level,
            timestamp: new Date(),
        };
        this.state.logs.push(logEntry);
        // Optional: Limit log size
        if (this.state.logs.length > 100) { // Keep last 100 logs
            this.state.logs.shift();
        }
        this.websocketService.sendAgentLog(this.projectId, logEntry);
    }
}
