import { FileService } from '@/services/file.service';
import { WebSocketService } from '@/services/websocket.service';
import { WorkPlan, WorkPlanStep } from './thinking'; // Assuming WorkPlan and WorkPlanStep are here
import { AgentAction, ActionType, LogLevel } from '@/types/agent';
import { File, FileType } from '@/types/file'; // Assuming File and FileType are defined

// Placeholder for a more sophisticated code generation service/module
interface CodeGenerationResult {
    filePath: string;
    content: string;
    success: boolean;
    error?: string;
}

export class ExecutionEngine {
    private projectId: string;
    private fileService: FileService;
    private websocketService: WebSocketService;
    // private aiService: AIService; // May be needed for code generation or modification guidance

    constructor(
        projectId: string,
        fileService: FileService,
        websocketService: WebSocketService
        // aiService: AIService // Potentially add AI service for intelligent execution
    ) {
        this.projectId = projectId;
        this.fileService = fileService;
        this.websocketService = websocketService;
        // this.aiService = aiService;
    }

    private emitExecutionUpdate(message: string, actionType: ActionType, details?: any, target?: string): void {
        const action: AgentAction = {
            type: actionType,
            description: message,
            target: target,
            details: details,
            timestamp: new Date(),
        };
        this.websocketService.sendAgentAction(this.projectId, action);
        // Also log this execution step
        this.websocketService.sendAgentLog(this.projectId, {
            id: crypto.randomUUID(),
            message: `Execution: ${message}`,
            level: LogLevel.INFO, // Or DEBUG
            timestamp: new Date(),
            context: details,
        });
        console.log(`[ExecutionEngine][${this.projectId}] ${message}`);
    }

    public async executeWorkPlan(workPlan: WorkPlan): Promise<boolean> {
        this.emitExecutionUpdate(`Starting execution of work plan: ${workPlan.overallGoal}`, ActionType.BUILD, { planId: workPlan.id });

        for (let i = 0; i < workPlan.steps.length; i++) {
            const step = workPlan.steps[i];
            workPlan.currentStepIndex = i;
            step.status = 'in-progress';
            this.emitExecutionUpdate(`Executing step: ${step.description}`, ActionType.ANALYZE, { stepId: step.id, description: step.description });
            // this.websocketService.sendAgentProgress(...) // TODO: Update overall progress via AgentController

            try {
                // Simulate execution based on step description (placeholder)
                // In a real scenario, this would involve more complex logic,
                // potentially calling other methods of ExecutionEngine like createFile, modifyFile, runCode, etc.
                await this.executeStep(step);
                step.status = 'completed';
                this.emitExecutionUpdate(`Completed step: ${step.description}`, ActionType.AGENT_RESPONSE, { stepId: step.id, status: 'completed' });
            } catch (error) {
                step.status = 'failed';
                const errorMessage = error instanceof Error ? error.message : "Unknown error during step execution";
                this.emitExecutionUpdate(`Failed step: ${step.description}. Error: ${errorMessage}`, ActionType.AGENT_RESPONSE, { stepId: step.id, status: 'failed', error: errorMessage });
                console.error(`[ExecutionEngine][${this.projectId}] Error executing step ${step.id}:`, error);
                // TODO: Decide on error handling strategy (e.g., stop plan, try to recover)
                return false; // Indicate plan execution failed
            }
        }
        this.emitExecutionUpdate(`Work plan execution finished: ${workPlan.overallGoal}`, ActionType.BUILD, { planId: workPlan.id, status: 'completed' });
        return true; // Indicate plan execution succeeded
    }

    private async executeStep(step: WorkPlanStep): Promise<void> {
        // Placeholder for actual step execution logic
        // This would parse step.description or use a more structured step type
        // to determine the action (e.g., createFile, modifyCode, runTest).
        console.log(`[ExecutionEngine][${this.projectId}] Simulating execution of: ${step.description}`);

        if (step.description.toLowerCase().includes("create file")) {
            const fileName = step.relatedFiles && step.relatedFiles.length > 0 ? step.relatedFiles[0] : `test-file-${crypto.randomUUID().substring(0, 8)}.txt`;
            const content = `// Content for ${fileName}\nCreated by Agent at ${new Date().toISOString()}`;
            await this.createFile(fileName, content, FileType.SOURCE_CODE); // Assuming SOURCE_CODE for now
        } else if (step.description.toLowerCase().includes("develop core game logic")) {
            // Simulate modifying a file or generating complex code
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
            this.emitExecutionUpdate("Simulated core game logic development.", ActionType.MODIFY_FILE, { file: "game-logic.ts" });
        } else {
            // Generic simulation for other steps
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        }
    }

    public async createFile(filePath: string, content: string, fileType: FileType = FileType.DOCUMENT): Promise<File> {
        this.emitExecutionUpdate(`Creating file: ${filePath}`, ActionType.CREATE_FILE, { path: filePath }, filePath);
        try {
            // Assuming fileService.createFile returns the created File object or similar
            // For now, let's mock the File object creation.
            // const createdFile = await this.fileService.createFile(this.projectId, filePath, content);

            // Mock implementation until FileService is fully integrated for this flow
            const mockFile: File = {
                id: crypto.randomUUID(),
                name: filePath.split('/').pop() || 'unknown.file',
                path: filePath,
                type: fileType,
                content: content,
                projectId: this.projectId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            console.log(`Mock file created: ${filePath}`);
            this.websocketService.sendFileCreated(this.projectId, mockFile); // Notify about file creation
            return mockFile;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error creating file";
            this.emitExecutionUpdate(`Failed to create file: ${filePath}. Error: ${errorMessage}`, ActionType.CREATE_FILE, { path: filePath, error: errorMessage }, filePath);
            throw error;
        }
    }

    public async modifyFile(filePath: string, newContent: string): Promise<File> {
        this.emitExecutionUpdate(`Modifying file: ${filePath}`, ActionType.MODIFY_FILE, { path: filePath }, filePath);
        try {
            // const updatedFile = await this.fileService.updateFile(this.projectId, fileId, newContent); // Need fileId
            // For now, mock it. We'd need a way to get fileId from filePath or have fileService handle paths.

            // Mock implementation
            const mockFile: File = {
                id: crypto.randomUUID(), // This would be the actual ID of the existing file
                name: filePath.split('/').pop() || 'unknown.file',
                path: filePath,
                type: FileType.DOCUMENT, // Or detect from extension, using DOCUMENT as placeholder
                content: newContent,
                projectId: this.projectId,
                createdAt: new Date(Date.now() - 3600000).toISOString(), // Older creation date
                updatedAt: new Date().toISOString(),
            };
            console.log(`Mock file modified: ${filePath}`);
            this.websocketService.sendFileUpdated(this.projectId, mockFile.id, { contentChange: " পুরো বিষয়বস্তু আপডেট করা হয়েছে" }); // "Content updated"
            return mockFile;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error modifying file";
            this.emitExecutionUpdate(`Failed to modify file: ${filePath}. Error: ${errorMessage}`, ActionType.MODIFY_FILE, { path: filePath, error: errorMessage }, filePath);
            throw error;
        }
    }

    public async deleteFile(filePath: string): Promise<boolean> {
        this.emitExecutionUpdate(`Deleting file: ${filePath}`, ActionType.DELETE_FILE, { path: filePath }, filePath);
        try {
            // const success = await this.fileService.deleteFile(this.projectId, fileId); // Need fileId
            // Mock implementation
            console.log(`Mock file deleted: ${filePath}`);
            const fileIdToDelete = `mock-id-for-${filePath}`; // Placeholder
            this.websocketService.sendFileDeleted(this.projectId, fileIdToDelete);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error deleting file";
            this.emitExecutionUpdate(`Failed to delete file: ${filePath}. Error: ${errorMessage}`, ActionType.DELETE_FILE, { path: filePath, error: errorMessage }, filePath);
            throw error;
        }
    }

    // Placeholder for a simple code generation system
    public async generateCodeSnippet(prompt: string): Promise<CodeGenerationResult> {
        this.emitExecutionUpdate(`Generating code snippet for prompt: "${prompt}"`, ActionType.ANALYZE); // Or a specific CODE_GENERATE type
        // TODO: Integrate with aiService for actual code generation
        // const generatedCode = await this.aiService.generateCode(prompt);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI call
        const result: CodeGenerationResult = {
            filePath: "generated/example.ts",
            content: `// Generated code for: ${prompt}\nconsole.log("Hello from generated code!");`,
            success: true,
        };
        this.emitExecutionUpdate(`Code snippet generated for: "${prompt}"`, ActionType.CREATE_FILE, { filePath: result.filePath, success: true }, result.filePath);
        return result;
    }
}
