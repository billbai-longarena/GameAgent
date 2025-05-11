// Based on design.md

// Forward declaration for File to avoid circular dependency if Project references File and File references ProjectId
// However, in this specific model, File[] is part of Project, but File does not directly reference Project object.
// So, direct import might be fine if File type is defined elsewhere and imported if needed.
// For now, assuming File type will be defined in its own file.

export enum GameType {
    QUIZ = 'quiz',
    MATCHING = 'matching',
    SORTING = 'sorting',
    DRAG_DROP = 'drag_drop',
    MEMORY = 'memory',
    PUZZLE = 'puzzle',
    SIMULATION = 'simulation',
    ROLE_PLAY = 'role_play'
}

export enum ProjectStatus {
    PLANNING = 'planning',
    IN_PROGRESS = 'in_progress',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    ARCHIVED = 'archived', // Added for completeness
    ERROR = 'error' // Added for error states
}

export enum DevelopmentStage {
    REQUIREMENT_ANALYSIS = 'requirement_analysis',
    DESIGN = 'design',
    CODING = 'coding',
    TESTING = 'testing',
    OPTIMIZATION = 'optimization',
    COMPLETED = 'completed' // Added a final completed stage
}

// Assuming File interface will be defined in types/file.ts
// If you need to use File[] here and avoid circular deps with a simple type reference:
// declare global {
//   interface FileTypeFromOtherModule { /* ... */ }
// }
// For now, we'll use a placeholder or assume it will be imported if services need it.
// For simplicity in this definition, we can use `any[]` or a more specific placeholder.
// Let's use `string[]` to represent file IDs or paths for now, or define a minimal File stub.

interface MinimalFile {
    id: string;
    name: string;
    path: string;
}

export interface Project {
    id: string; // UUID
    name: string;
    description: string;
    gameType: GameType;
    userId: string; // To associate project with a user
    createdAt: string; // ISO 8601 date string
    updatedAt: string; // ISO 8601 date string
    status: ProjectStatus;
    currentStage: DevelopmentStage;
    progress: number; // Percentage 0-100
    // files: MinimalFile[]; // List of files associated with the project
    // Instead of MinimalFile, let's assume file management is separate and project might just store IDs or count.
    // Or, if files are integral and always loaded with project, then File[] from 'types/file.ts'
    // For now, keeping it simple, can be expanded later.
    // Let's defer the 'files' property or make it optional for now.
    tags?: string[];
    version?: string; // e.g., "1.0.0"
}

// Example of a more detailed Project type if files are directly embedded (can lead to large objects)
// import { File } from './file'; // This would be the actual File type
// export interface ProjectWithFiles extends Project {
//   files: File[];
// }
