import { Project, ProjectStatus, DevelopmentStage, GameType } from '@/types/project';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

// In-memory store for projects for now
let projects: Project[] = [];

export class ProjectService {
    constructor() {
        // Initialize with some mock data if needed for development
        // this.initializeMockProjects();
    }

    private initializeMockProjects() {
        if (projects.length === 0) {
            projects.push({
                id: uuidv4(),
                name: '中国历史朝代排序',
                description: '一个关于中国古代朝代顺序的排序游戏。',
                gameType: GameType.SORTING,
                userId: 'teacher-001', // Example user ID
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: ProjectStatus.PLANNING,
                currentStage: DevelopmentStage.REQUIREMENT_ANALYSIS,
                progress: 10,
                tags: ['历史', '初中', '中国'],
                version: '1.0.0'
            });
            projects.push({
                id: uuidv4(),
                name: '基础数学问答',
                description: '多项选择题考察基础数学知识。',
                gameType: GameType.QUIZ,
                userId: 'teacher-002',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: ProjectStatus.IN_PROGRESS,
                currentStage: DevelopmentStage.CODING,
                progress: 45,
                tags: ['数学', '小学', '问答'],
                version: '1.0.0'
            });
        }
    }

    async createProject(
        name: string,
        description: string,
        gameType: GameType,
        userId: string,
        initialTags?: string[]
    ): Promise<Project> {
        const newProject: Project = {
            id: uuidv4(),
            name,
            description,
            gameType,
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: ProjectStatus.PLANNING,
            currentStage: DevelopmentStage.REQUIREMENT_ANALYSIS,
            progress: 0,
            tags: initialTags || [],
            version: '1.0.0'
        };
        projects.push(newProject);
        console.log(`ProjectService: Created project ${newProject.id} - ${newProject.name}`);
        return newProject;
    }

    async getProjectById(projectId: string): Promise<Project | undefined> {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            console.log(`ProjectService: Retrieved project ${project.id}`);
        } else {
            console.warn(`ProjectService: Project with ID ${projectId} not found.`);
        }
        return project;
    }

    async getAllProjects(userId?: string): Promise<Project[]> {
        // If userId is provided, filter projects by userId
        // For now, returning all projects as user management is not fully implemented
        console.log(`ProjectService: Retrieving all projects.`);
        if (userId) {
            return projects.filter(p => p.userId === userId);
        }
        return [...projects]; // Return a copy
    }

    async updateProject(projectId: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'userId'>>): Promise<Project | undefined> {
        const projectIndex = projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) {
            console.warn(`ProjectService: Cannot update. Project with ID ${projectId} not found.`);
            return undefined;
        }

        const originalProject = projects[projectIndex];

        // 确保 updatedAt 与 createdAt 不同，通过增加一毫秒
        const updateTime = new Date();
        if (updateTime.toISOString() === originalProject.createdAt) {
            updateTime.setMilliseconds(updateTime.getMilliseconds() + 1);
        }

        const updatedProject = {
            ...originalProject,
            ...updates,
            updatedAt: updateTime.toISOString(),
        };
        projects[projectIndex] = updatedProject;
        console.log(`ProjectService: Updated project ${updatedProject.id}`);
        return updatedProject;
    }

    async deleteProject(projectId: string): Promise<boolean> {
        const initialLength = projects.length;
        projects = projects.filter(p => p.id !== projectId);
        const success = projects.length < initialLength;
        if (success) {
            console.log(`ProjectService: Deleted project ${projectId}`);
        } else {
            console.warn(`ProjectService: Cannot delete. Project with ID ${projectId} not found.`);
        }
        return success;
    }

    // TODO: Add methods for managing project files (linking file IDs, etc.) if project stores file list.
    // TODO: Implement persistence (e.g., writing to a JSON file or database)

    /**
     * Resets the projects array. This method is intended for testing purposes only.
     * @internal
     */
    resetForTesting(): void {
        if (process.env.NODE_ENV === 'test') {
            projects = [];
            console.log('ProjectService: Reset in-memory store for testing');
        } else {
            console.warn('ProjectService: resetForTesting should only be called in test environment');
        }
    }
}

export const projectService = new ProjectService();
