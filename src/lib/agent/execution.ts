import { FileService } from '@/services/file.service';
import { WebSocketService } from '@/services/websocket.service';
import { WorkPlan, WorkPlanStep } from './thinking'; // Assuming WorkPlan and WorkPlanStep are here
import { AgentAction, ActionType, LogLevel } from '@/types/agent';
import { File, FileType } from '@/types/file'; // Assuming File and FileType are defined

/**
 * 生成UUID的辅助函数，兼容测试环境
 * @returns 生成的UUID字符串
 */
function generateUUID(): string {
    // 如果浏览器环境支持 crypto.randomUUID()
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // 兼容性实现，用于测试环境或不支持crypto.randomUUID的浏览器
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

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

    // 辅助函数，发送日志到前端
    private sendLog(message: string, level: LogLevel = LogLevel.INFO, context?: any): void {
        this.websocketService.sendAgentLog(this.projectId, {
            id: generateUUID(),
            message: `ExecutionEngine: ${message}`,
            level,
            timestamp: new Date(),
            context
        });
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
            id: generateUUID(),
            message: `Execution: ${message}`,
            level: LogLevel.INFO, // Or DEBUG
            timestamp: new Date(),
            context: details,
        });
        this.sendLog(message);
    }

    public async executeWorkPlan(workPlan: WorkPlan): Promise<boolean> {
        this.sendLog(`Executing work plan >>>\n${JSON.stringify(workPlan, null, 2)}\n<<< END WORK PLAN`);
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
                this.sendLog(`Executing step >>>\n${JSON.stringify(step, null, 2)}\n<<< END STEP`);
                await this.executeStep(step);
                step.status = 'completed';
                this.emitExecutionUpdate(`Completed step: ${step.description}`, ActionType.AGENT_RESPONSE, { stepId: step.id, status: 'completed' });
            } catch (error) {
                step.status = 'failed';
                const errorMessage = error instanceof Error ? error.message : "Unknown error during step execution";
                this.emitExecutionUpdate(`Failed step: ${step.description}. Error: ${errorMessage}`, ActionType.AGENT_RESPONSE, { stepId: step.id, status: 'failed', error: errorMessage });
                this.sendLog(`Error executing step ${step.id}:`, LogLevel.ERROR, error);
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
        this.sendLog(`Simulating execution of step: ${step.description}`);

        if (step.description.toLowerCase().includes("create file")) {
            const fileName = step.relatedFiles && step.relatedFiles.length > 0 ? step.relatedFiles[0] : `test-file-${generateUUID().substring(0, 8)}.txt`;
            const content = `// Content for ${fileName}\nCreated by Agent at ${new Date().toISOString()}`;
            await this.createFile(fileName, content, FileType.SOURCE_CODE); // Assuming SOURCE_CODE for now
        } else if (step.description.toLowerCase().includes("develop core game logic")) {
            // Simulate modifying a file or generating complex code
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
            this.emitExecutionUpdate("Simulated core game logic development.", ActionType.MODIFY_FILE, { file: "game-logic.ts" }, "game-logic.ts");
        } else {
            // Generic simulation for other steps
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        }
    }

    public async createFile(filePath: string, content: string, fileType: FileType = FileType.DOCUMENT): Promise<File> {
        this.sendLog(`Creating file ${filePath} with content >>>\n${content}\n<<< END CONTENT`);
        this.emitExecutionUpdate(`Creating file: ${filePath}`, ActionType.CREATE_FILE, { path: filePath }, filePath);
        try {
            // Create the directory if it doesn't exist
            const dirName = filePath.split('/').slice(0, -1).join('/');
            if (dirName) {
                await this.fileService.createDirectory(dirName);
            }

            // Write the file
            await this.fileService.writeFile(filePath, content);

            // Create a File object
            const file: File = {
                id: generateUUID(),
                name: filePath.split('/').pop() || 'unknown.file',
                path: filePath,
                type: fileType,
                content: content,
                projectId: this.projectId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            this.sendLog(`File created: ${filePath}`);
            this.websocketService.sendFileCreated(this.projectId, file); // Notify about file creation
            return file;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error creating file";
            this.emitExecutionUpdate(`Failed to create file: ${filePath}. Error: ${errorMessage}`, ActionType.CREATE_FILE, { path: filePath, error: errorMessage }, filePath);
            throw error;
        }
    }

    public async modifyFile(filePath: string, newContent: string): Promise<File> {
        this.sendLog(`Modifying file ${filePath} with new content >>>\n${newContent}\n<<< END CONTENT`);
        this.emitExecutionUpdate(`Modifying file: ${filePath}`, ActionType.MODIFY_FILE, { path: filePath }, filePath);
        try {
            // Check if file exists
            const fileExists = await this.fileService.fileExists(filePath);
            if (!fileExists) {
                throw new Error(`File does not exist: ${filePath}`);
            }

            // Write the new content to the file
            await this.fileService.writeFile(filePath, newContent);

            // Create a File object
            const file: File = {
                id: generateUUID(), // In a real implementation, we would get the actual ID
                name: filePath.split('/').pop() || 'unknown.file',
                path: filePath,
                type: FileType.DOCUMENT, // In a real implementation, we would detect the type
                content: newContent,
                projectId: this.projectId,
                createdAt: new Date(Date.now() - 3600000).toISOString(), // Placeholder for creation date
                updatedAt: new Date().toISOString(),
            };

            this.sendLog(`File modified: ${filePath}`);
            this.websocketService.sendFileUpdated(this.projectId, file.id, { contentChange: "Content updated" });
            return file;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error modifying file";
            this.emitExecutionUpdate(`Failed to modify file: ${filePath}. Error: ${errorMessage}`, ActionType.MODIFY_FILE, { path: filePath, error: errorMessage }, filePath);
            throw error;
        }
    }

    public async deleteFile(filePath: string): Promise<boolean> {
        this.sendLog(`Deleting file ${filePath}`);
        this.emitExecutionUpdate(`Deleting file: ${filePath}`, ActionType.DELETE_FILE, { path: filePath }, filePath);
        try {
            // Check if file exists
            const fileExists = await this.fileService.fileExists(filePath);
            if (!fileExists) {
                throw new Error(`File does not exist: ${filePath}`);
            }

            // Delete the file
            await this.fileService.deleteFile(filePath);

            // Generate a file ID for the WebSocket notification
            const fileId = `file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`;

            this.sendLog(`File deleted: ${filePath}`);
            this.websocketService.sendFileDeleted(this.projectId, fileId);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error deleting file";
            this.emitExecutionUpdate(`Failed to delete file: ${filePath}. Error: ${errorMessage}`, ActionType.DELETE_FILE, { path: filePath, error: errorMessage }, filePath);
            throw error;
        }
    }

    // Placeholder for a simple code generation system
    public async generateCodeSnippet(prompt: string): Promise<CodeGenerationResult> {
        this.sendLog(`Generating code snippet for prompt >>>\n${prompt}\n<<< END PROMPT`);
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
