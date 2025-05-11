export enum DevelopmentStage {
    REQUIREMENT_ANALYSIS = 'requirement_analysis',
    DESIGN = 'design',
    CODING = 'coding',
    TESTING = 'testing',
    OPTIMIZATION = 'optimization',
    COMPLETED = 'completed', // Added for clarity
}

export enum AgentStatus {
    IDLE = 'idle',
    THINKING = 'thinking',
    CODING = 'coding',
    TESTING = 'testing',
    PAUSED = 'paused',
    COMPLETED = 'completed', // Consistent with ProjectStatus and general states
    ERROR = 'error', // Added for error handling
}

export enum ActionType {
    IDLE = 'idle', // Added for when the agent is idle
    INITIALIZE = 'initialize', // Added for initial state
    CREATE_FILE = 'create_file',
    MODIFY_FILE = 'modify_file',
    DELETE_FILE = 'delete_file',
    RUN_TEST = 'run_test',
    BUILD = 'build',
    ANALYZE = 'analyze',
    USER_INPUT = 'user_input', // For logging user interactions
    AGENT_RESPONSE = 'agent_response', // For logging agent high-level responses
}

export interface AgentAction {
    type: ActionType | string; // Allow string for flexibility if new actions are added dynamically
    description: string;
    target?: string; // File path or other relevant target
    timestamp: Date;
    details?: Record<string, any>; // For additional context specific to the action
}

export enum LogLevel {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    SUCCESS = 'success',
    DEBUG = 'debug', // Added for more granular logging
}

export interface AgentLog {
    id: string;
    message: string;
    level: LogLevel;
    timestamp: Date;
    context?: any; // Additional context for the log entry
}

export interface AgentState {
    id: string; // Agent instance ID, could be same as projectId
    projectId: string;
    currentTask: string; // High-level description of the current task
    thinking: string; // Agent's current thought process or plan
    action: AgentAction; // The last or current action being performed
    stage: DevelopmentStage; // Current stage in the development lifecycle
    progress: number; // Overall progress percentage (0-100)
    status: AgentStatus; // Current operational status of the Agent
    logs: AgentLog[]; // Array of log entries
    estimatedTimeRemaining: number; // Estimated time in seconds for current task or overall
    error?: { // Optional error details if status is ERROR
        message: string;
        details?: string;
    };
}
