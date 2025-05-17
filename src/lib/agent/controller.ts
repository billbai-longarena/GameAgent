import { AIService } from '@/services/ai.service';
import { WebSocketService } from '@/services/websocket.service';
import { AgentState, AgentStatus, DevelopmentStage, AgentLog, LogLevel, ActionType, ThoughtStep, ThoughtStage } from '@/types/agent';
import { ThinkingEngine, RequirementAnalysis, WorkPlan, TaskType } from './thinking';
import { ExecutionEngine } from './execution';
import { FileService } from '@/services/file.service';
import { GameGenerator, GameRequirements, Customizations, GeneratedGame } from '../game/generator';
import { GameType, Project } from '@/types/project';

export class AgentController {
    private projectId: string;
    private project: Project;
    private aiService: AIService;
    private websocketService: WebSocketService;
    private thinkingEngine: ThinkingEngine;
    private executionEngine: ExecutionEngine;
    private gameGenerator: GameGenerator;
    private state: AgentState;
    private currentWorkPlan: WorkPlan | null = null;

    constructor(
        project: Project,
        aiService: AIService,
        websocketService: WebSocketService,
        thinkingEngine: ThinkingEngine,
        executionEngine: ExecutionEngine,
        gameGenerator: GameGenerator
    ) {
        this.project = project;
        this.projectId = project.id;
        this.aiService = aiService;
        this.websocketService = websocketService;
        this.thinkingEngine = thinkingEngine;
        this.executionEngine = executionEngine;
        this.gameGenerator = gameGenerator;
        this.state = this.initializeState();
        this.emitStateUpdate();
    }

    private initializeState(): AgentState {
        const initialThought: ThoughtStep = {
            id: crypto.randomUUID(),
            stage: ThoughtStage.INTERNAL_STATE_UPDATE,
            description: 'Agent is initializing.',
            status: 'completed',
            timestamp: new Date().toISOString(),
        };
        return {
            id: this.projectId,
            projectId: this.projectId,
            currentTask: 'Initializing Agent',
            thinking: initialThought.description,
            thoughtProcess: [initialThought],
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
                level: LogLevel.INFO,
                timestamp: new Date(),
            }],
            estimatedTimeRemaining: 0,
        };
    }

    private addThoughtStep(stepData: Omit<ThoughtStep, 'id' | 'timestamp'>): ThoughtStep {
        const newStep: ThoughtStep = {
            ...stepData,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
        };
        this.state.thoughtProcess = [...(this.state.thoughtProcess || []), newStep].slice(-50);
        this.state.thinking = newStep.description; // Keep single 'thinking' string updated
        this.emitStateUpdate(); // Emit full state, which includes thoughtProcess
        return newStep;
    }

    private emitStateUpdate(): void {
        if (this.state.thoughtProcess && this.state.thoughtProcess.length > 0) {
            this.state.thinking = this.state.thoughtProcess[this.state.thoughtProcess.length - 1].description;
        }
        this.addLog(`Agent state updated: Thinking: ${this.state.thinking}`, LogLevel.INFO);
        this.websocketService.sendAgentState(this.projectId, this.state);
    }

    public async start(instruction: string): Promise<void> {
        if (this.state.status === AgentStatus.IDLE || this.state.status === AgentStatus.PAUSED || this.state.status === AgentStatus.COMPLETED) {
            this.addLog(`Starting agent with instruction >>>\n${instruction}\n<<< END INSTRUCTION`, LogLevel.INFO);
            this.state.status = AgentStatus.THINKING;
            this.state.currentTask = `Processing instruction: ${instruction}`;
            this.state.action = { type: ActionType.USER_INPUT, description: `Start instruction: ${instruction}`, timestamp: new Date() };

            this.addThoughtStep({
                stage: ThoughtStage.PROBLEM_DEFINITION,
                description: `Received instruction: "${instruction}"`,
                status: 'in-progress',
            });
            this.addLog('Agent started processing instruction.', LogLevel.INFO);
            // emitStateUpdate is called by addThoughtStep

            try {
                this.addThoughtStep({
                    stage: DevelopmentStage.REQUIREMENT_ANALYSIS,
                    description: 'Analyzing user requirements...',
                    status: 'in-progress',
                });
                this.state.stage = DevelopmentStage.REQUIREMENT_ANALYSIS;
                // emitStateUpdate is called by addThoughtStep

                let analysis: RequirementAnalysis;
                try {
                    this.addLog(`Calling AI service for requirement analysis...`, LogLevel.INFO);
                    analysis = await this.thinkingEngine.analyzeRequirement(this.projectId, instruction);
                    this.addLog(`AI service returned analysis:`, LogLevel.INFO, analysis);
                } catch (err) {
                    const analysisErrorMsg = `Error during requirement analysis: ${(err as Error).message}`;
                    this.addThoughtStep({
                        stage: DevelopmentStage.REQUIREMENT_ANALYSIS,
                        description: analysisErrorMsg,
                        status: 'failed',
                        details: (err instanceof Error ? { name: err.name, message: err.message } : { error: String(err) })
                    });
                    this.state.status = AgentStatus.ERROR;
                    this.state.error = { message: `Requirement analysis failed: ${(err as Error).message}` };
                    this.addLog(`Requirement analysis error: ${(err as Error).message}`, LogLevel.ERROR);
                    // emitStateUpdate is called by addThoughtStep
                    return;
                }

                this.addThoughtStep({
                    stage: DevelopmentStage.REQUIREMENT_ANALYSIS,
                    description: `Analysis complete. Goals: ${analysis.goals.join(', ')}.`,
                    details: analysis,
                    status: 'completed',
                });

                if (analysis.clarificationsNeeded && analysis.clarificationsNeeded.length > 0) {
                    const clarificationMsg = `Clarifications needed: ${analysis.clarificationsNeeded.join('; ')}`;
                    this.addThoughtStep({
                        stage: DevelopmentStage.REQUIREMENT_ANALYSIS,
                        description: clarificationMsg,
                        status: 'pending',
                    });
                    this.addLog(clarificationMsg, LogLevel.INFO);
                    this.state.status = AgentStatus.PAUSED;
                    this.emitStateUpdate(); // Emit PAUSED state
                    return;
                }
                this.addLog('Requirement analysis complete.', LogLevel.INFO);

                this.addThoughtStep({
                    stage: DevelopmentStage.DESIGN,
                    description: 'Generating work plan...',
                    status: 'in-progress',
                });
                this.state.stage = DevelopmentStage.DESIGN;
                // emitStateUpdate called by addThoughtStep

                this.addLog(`Calling AI service to generate work plan...`, LogLevel.INFO);
                const plan: WorkPlan = await this.thinkingEngine.generateWorkPlan(this.projectId, analysis);
                this.addLog(`AI service returned work plan:`, LogLevel.INFO, plan);
                this.currentWorkPlan = plan;

                this.addThoughtStep({
                    stage: DevelopmentStage.DESIGN,
                    description: `Work Plan Generated: ${plan.steps.length} steps. First step: ${plan.steps[0]?.description}`,
                    details: plan,
                    status: 'completed',
                });
                this.addLog(`Work plan generated with ${plan.steps.length} steps.`, LogLevel.INFO);

                this.addThoughtStep({
                    stage: DevelopmentStage.CODING,
                    description: 'Starting work plan execution...',
                    status: 'in-progress',
                });
                this.state.stage = DevelopmentStage.CODING;
                this.addLog('Handing off to Execution Engine.', LogLevel.INFO);
                // emitStateUpdate called by addThoughtStep

                const gameGenerationStep = plan.steps.find(step => step.type === TaskType.GENERATE_GAME_CODE || step.type === TaskType.CUSTOMIZE_GAME_ASSETS);

                if (gameGenerationStep && this.project.gameType) {
                    this.addThoughtStep({
                        stage: ThoughtStage.GAME_GENERATION,
                        description: 'Starting game generation phase.',
                        status: 'in-progress',
                    });
                    // emitStateUpdate called by addThoughtStep

                    const gameReqs: GameRequirements = {
                        title: this.project.name || 'My Awesome Game',
                        description: this.project.description || 'A fun game generated by AI.',
                    };
                    if (this.project.gameType === GameType.QUIZ && analysis.details?.questions) {
                        gameReqs.questions = analysis.details.questions;
                    } else if (this.project.gameType === GameType.MATCHING && analysis.details?.pairs) {
                        gameReqs.pairs = analysis.details.pairs;
                    } else if (this.project.gameType === GameType.SORTING && analysis.details?.sortableItems) {
                        gameReqs.sortableItems = analysis.details.sortableItems;
                    }

                    const customizations: Customizations = { difficulty: 'medium' };

                    this.addLog(`Calling game generator with requirements:`, LogLevel.INFO, gameReqs);
                    const generatedGame: GeneratedGame | null = await this.gameGenerator.generateGame(
                        this.project,
                        this.project.gameType,
                        gameReqs,
                        customizations
                    );
                    this.addLog(`Game generator returned:`, LogLevel.INFO, generatedGame ? `Game with ${generatedGame.files.length} files` : 'null');

                    if (generatedGame && generatedGame.files.length > 0) {
                        this.addThoughtStep({
                            stage: ThoughtStage.GAME_GENERATION,
                            description: `Game generated with ${generatedGame.files.length} files. Preview at: ${generatedGame.previewUrl}`,
                            details: generatedGame,
                            status: 'completed',
                        });
                        this.addLog(`Game generated with ${generatedGame.files.length} files. Preview at: ${generatedGame.previewUrl}`, LogLevel.SUCCESS);
                        if (generatedGame.previewUrl) {
                            this.websocketService.sendPreviewUpdated(this.projectId, generatedGame.previewUrl);
                        }
                        // Send game:generated event
                        // Ensure gameReqs and this.project.gameType are accessible here.
                        // They are defined in the outer scope of the gameGenerationStep check.
                        const newGameListItem = {
                            id: generatedGame.gameId,
                            name: gameReqs.title || `Generated Game ${generatedGame.gameId}`,
                            description: gameReqs.description || `AI Generated game based on ${generatedGame.baseTemplateId}`,
                            entryPoint: generatedGame.previewUrl || `/${generatedGame.files.find(f => f.name.endsWith('.html'))?.path}`,
                            previewImageUrl: `/${generatedGame.files.find(f => f.name.includes('-preview') && (f.name.endsWith('.png') || f.name.endsWith('.jpg')))?.path}`, // Basic assumption
                            isGenerated: true,
                            generatedAt: new Date().toISOString(),
                            tags: ['AI Generated', this.project.gameType ? this.project.gameType.toString() : 'UnknownType'],
                        };
                        this.websocketService.sendGameGenerated(this.projectId, newGameListItem);

                    } else {
                        this.addThoughtStep({
                            stage: ThoughtStage.GAME_GENERATION,
                            description: 'Game generation failed or produced no files.',
                            status: 'failed',
                        });
                        this.addLog('Game generation failed or produced no files.', LogLevel.WARNING);
                    }
                }

                this.addThoughtStep({
                    stage: DevelopmentStage.CODING,
                    description: 'Executing remaining work plan steps (if any).',
                    status: 'in-progress',
                });
                this.addLog('Executing remaining work plan steps (if any).', LogLevel.INFO);

                this.addLog(`Calling execution engine to execute work plan...`, LogLevel.INFO);
                const executionSuccess = await this.executionEngine.executeWorkPlan(plan);
                this.addLog(`Execution engine returned:`, LogLevel.INFO, executionSuccess ? 'success' : 'failure');

                if (executionSuccess) {
                    this.state.progress = 100;
                    this.completeTask('Work plan executed successfully (including any game generation).');
                } else {
                    this.addThoughtStep({
                        stage: DevelopmentStage.CODING,
                        description: 'Work plan execution failed or was incomplete.',
                        status: 'failed',
                        details: 'One or more steps in the work plan failed or game generation issues.'
                    });
                    this.state.status = AgentStatus.ERROR;
                    this.state.error = { message: 'One or more steps in the work plan failed or game generation issues.' };
                    this.addLog('Work plan execution failed or had issues.', LogLevel.ERROR);
                    this.emitStateUpdate();
                }

            } catch (error) {
                this.addLog(`Error during agent execution:`, LogLevel.ERROR, error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.addThoughtStep({
                    stage: this.state.stage || ThoughtStage.INTERNAL_STATE_UPDATE,
                    description: `Execution error: ${errorMessage}`,
                    status: 'failed',
                    details: (error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { error: String(error) })
                });
                this.state.status = AgentStatus.ERROR;
                this.state.error = { message: errorMessage };
                this.addLog(`Execution error: ${errorMessage}`, LogLevel.ERROR);
                this.emitStateUpdate(); // emitStateUpdate is called by addThoughtStep, but call explicitly if error state needs immediate propagation
            }
        } else {
            this.addLog('Agent is already running or in an invalid state to start.', LogLevel.WARNING);
            this.emitStateUpdate();
        }
    }

    public pause(): void {
        if (this.state.status === AgentStatus.THINKING || this.state.status === AgentStatus.CODING || this.state.status === AgentStatus.TESTING) {
            this.addLog(`Pausing agent for project ${this.projectId}`, LogLevel.INFO);
            const thinkingBeforePause = this.state.thinking;
            this.state.status = AgentStatus.PAUSED;
            this.state.action = { type: ActionType.USER_INPUT, description: 'User paused agent', details: { thinkingBeforePause }, timestamp: new Date() };
            this.addThoughtStep({
                stage: ThoughtStage.INTERNAL_STATE_UPDATE,
                description: 'Agent paused by user.',
                status: 'info',
                details: { thinkingBeforePause }
            });
            this.addLog('Agent paused.', LogLevel.INFO);
            // emitStateUpdate is called by addThoughtStep
        } else {
            this.addLog('Agent cannot be paused in its current state.', LogLevel.WARNING);
            this.emitStateUpdate();
        }
    }

    public resume(): void {
        if (this.state.status === AgentStatus.PAUSED) {
            this.addLog(`Resuming agent for project ${this.projectId}`, LogLevel.INFO);
            this.state.status = AgentStatus.THINKING;
            this.state.action = { type: ActionType.USER_INPUT, description: 'User resumed agent', timestamp: new Date() };
            this.addThoughtStep({
                stage: ThoughtStage.INTERNAL_STATE_UPDATE,
                description: 'Agent resumed by user. Re-evaluating current task...',
                status: 'in-progress',
            });
            this.addLog('Agent resumed.', LogLevel.INFO);
            // emitStateUpdate is called by addThoughtStep

            setTimeout(() => {
                if (this.state.status === AgentStatus.THINKING) {
                    this.addLog("Resuming: Re-triggering a simplified start for demo purposes.", LogLevel.INFO);
                }
            }, 1000);
        } else {
            this.addLog('Agent is not paused or cannot be resumed.', LogLevel.WARNING);
            this.emitStateUpdate();
        }
    }

    public stop(): void {
        this.addLog(`Stopping agent for project ${this.projectId}`, LogLevel.INFO);
        this.state.status = AgentStatus.IDLE;
        this.state.currentTask = 'Agent stopped.';
        this.state.progress = 0;
        this.state.action = { type: ActionType.USER_INPUT, description: 'User stopped agent', timestamp: new Date() };
        this.addThoughtStep({
            stage: ThoughtStage.INTERNAL_STATE_UPDATE,
            description: 'Agent stopped by user. All tasks cleared.',
            status: 'info',
        });
        this.addLog('Agent stopped and reset.', LogLevel.INFO);
        // emitStateUpdate is called by addThoughtStep
    }

    private completeTask(completionMessage: string): void {
        this.state.status = AgentStatus.COMPLETED;
        this.state.currentTask = `Completed: ${completionMessage}`;
        this.state.progress = 100;
        this.state.action = { type: ActionType.AGENT_RESPONSE, description: `Task completed: ${completionMessage}`, timestamp: new Date() };
        this.addThoughtStep({
            stage: DevelopmentStage.COMPLETED,
            description: `Task completed: ${completionMessage}`,
            status: 'completed',
        });
        this.addLog(completionMessage, LogLevel.SUCCESS);
        // emitStateUpdate is called by addThoughtStep
    }

    public getState(): AgentState {
        return { ...this.state };
    }

    private addLog(message: string, level: LogLevel, context?: any): void {
        const logEntry: AgentLog = {
            id: crypto.randomUUID(),
            message,
            level,
            timestamp: new Date(),
            context
        };
        this.state.logs = [...(this.state.logs || []), logEntry].slice(-100);
        this.websocketService.sendAgentLog(this.projectId, logEntry);
    }
}
