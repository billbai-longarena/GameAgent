// Based on design.md

export enum FileType {
    DOCUMENT = 'document', // .md, .txt
    SOURCE_CODE = 'source_code', // .js, .ts, .jsx, .tsx
    STYLE = 'style', // .css, .scss
    ASSET = 'asset', // images, audio, video
    CONFIG = 'config', // .json, .yaml, .xml
    TEST = 'test', // .test.js, .spec.ts
    OTHER = 'other' // For any other file types
}

export interface File {
    id: string; // UUID
    projectId: string; // ID of the project this file belongs to
    name: string; // File name, e.g., "MyComponent.tsx"
    path: string; // Full path relative to project root, e.g., "src/components/MyComponent.tsx"
    type: FileType;
    content?: string; // File content, might be omitted for large files or binary files in listings
    size?: number; // File size in bytes
    createdAt: string; // ISO 8601 date string
    updatedAt: string; // ISO 8601 date string
    isEditable?: boolean; // Whether the file is typically editable by the agent/user
    isBinary?: boolean; // True if the file is binary
    mimeType?: string; // e.g., "text/typescript", "image/png"
}

// Interface for file changes, could be used in WebSocket events or services
export interface FileChange {
    id: string; // Unique ID for the change event itself (e.g., for React keys)
    operation: 'create' | 'update' | 'delete';
    file: Partial<File>; // For delete, only id/path might be relevant. For create/update, more fields.
    diff?: string; // For updates, a diff string could be provided
    timestamp: string; // ISO 8601 date string for when the change event occurred
}
