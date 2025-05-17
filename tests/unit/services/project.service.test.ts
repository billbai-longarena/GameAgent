/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';
import { ProjectService, projectService } from '@/services/project.service';
import { Project, ProjectStatus, DevelopmentStage, GameType } from '@/types/project';
import { v4 as uuidv4 } from 'uuid';

// To directly manipulate the in-memory projects array for testing,
// we might need to export it from the service or use a special test setup.
// For now, we'll test through the service's public interface and reset the singleton's state.

// Jest runs in NODE_ENV=test by default, no need to set it
// process.env.NODE_ENV = 'test'; // This would cause TypeScript error as NODE_ENV is readonly

describe('ProjectService', () => {
    // Use the exported singleton instance for tests
    const serviceInstance = projectService;

    beforeEach(() => {
        // Reset the service state before each test using the new testing method
        serviceInstance.resetForTesting();
    });

    describe('createProject', () => {
        it('should create a new project with correct initial values', async () => {
            const projectData = {
                name: 'Test Project 1',
                description: 'A test project description',
                gameType: GameType.QUIZ,
                userId: 'user-123',
                initialTags: ['test', 'quiz'],
            };
            const createdProject = await serviceInstance.createProject(
                projectData.name,
                projectData.description,
                projectData.gameType,
                projectData.userId,
                projectData.initialTags
            );

            expect(createdProject.id).toBeDefined();
            expect(createdProject.name).toBe(projectData.name);
            expect(createdProject.description).toBe(projectData.description);
            expect(createdProject.gameType).toBe(projectData.gameType);
            expect(createdProject.userId).toBe(projectData.userId);
            expect(createdProject.tags).toEqual(projectData.initialTags);
            expect(createdProject.status).toBe(ProjectStatus.PLANNING);
            expect(createdProject.currentStage).toBe(DevelopmentStage.REQUIREMENT_ANALYSIS);
            expect(createdProject.progress).toBe(0);
            expect(createdProject.version).toBe('1.0.0');
            expect(createdProject.createdAt).toBeDefined();
            expect(createdProject.updatedAt).toBeDefined();
            expect(createdProject.createdAt).toEqual(createdProject.updatedAt);

            // Verify the project was added to the store by retrieving it
            const retrievedProject = await serviceInstance.getProjectById(createdProject.id);
            expect(retrievedProject).toEqual(createdProject);
        });
    });

    describe('getProjectById', () => {
        it('should return a project if found', async () => {
            const p = await serviceInstance.createProject('P1', 'D1', GameType.MATCHING, 'u1');
            const foundProject = await serviceInstance.getProjectById(p.id);
            expect(foundProject).toBeDefined();
            expect(foundProject?.id).toBe(p.id);
        });

        it('should return undefined if project not found', async () => {
            const foundProject = await serviceInstance.getProjectById('non-existent-id');
            expect(foundProject).toBeUndefined();
        });
    });

    describe('getAllProjects', () => {
        it('should return all projects if no userId is provided', async () => {
            await serviceInstance.createProject('P1', 'D1', GameType.SORTING, 'u1');
            await serviceInstance.createProject('P2', 'D2', GameType.QUIZ, 'u2');
            const allProjects = await serviceInstance.getAllProjects();
            expect(allProjects.length).toBe(2);
        });

        it('should return only projects for the given userId if provided', async () => {
            await serviceInstance.createProject('P1', 'D1', GameType.SORTING, 'user-alpha');
            await serviceInstance.createProject('P2', 'D2', GameType.QUIZ, 'user-beta');
            await serviceInstance.createProject('P3', 'D3', GameType.MATCHING, 'user-alpha');

            const alphaProjects = await serviceInstance.getAllProjects('user-alpha');
            expect(alphaProjects.length).toBe(2);
            expect(alphaProjects.every(p => p.userId === 'user-alpha')).toBe(true);

            const betaProjects = await serviceInstance.getAllProjects('user-beta');
            expect(betaProjects.length).toBe(1);
            expect(betaProjects[0].userId).toBe('user-beta');
        });

        it('should return an empty array if no projects exist', async () => {
            const allProjects = await serviceInstance.getAllProjects();
            expect(allProjects.length).toBe(0);
        });
    });

    describe('updateProject', () => {
        it('should update an existing project and return the updated project', async () => {
            const p = await serviceInstance.createProject('Initial Name', 'Desc', GameType.DRAG_DROP, 'u1');
            const updates: Partial<Omit<Project, 'id' | 'createdAt' | 'userId'>> = {
                name: 'Updated Name',
                status: ProjectStatus.IN_PROGRESS,
                progress: 50,
            };
            const updatedProject = await serviceInstance.updateProject(p.id, updates);

            expect(updatedProject).toBeDefined();
            expect(updatedProject?.name).toBe('Updated Name');
            expect(updatedProject?.status).toBe(ProjectStatus.IN_PROGRESS);
            expect(updatedProject?.progress).toBe(50);
            expect(updatedProject?.updatedAt).not.toBe(p.createdAt); // updatedAt should change

            // Verify the update was persisted
            const retrievedProject = await serviceInstance.getProjectById(p.id);
            expect(retrievedProject?.name).toBe('Updated Name');
        });

        it('should return undefined if trying to update a non-existent project', async () => {
            const updates = { name: 'Non Existent Update' };
            const updatedProject = await serviceInstance.updateProject('non-existent-id', updates);
            expect(updatedProject).toBeUndefined();
        });
    });

    describe('deleteProject', () => {
        it('should delete an existing project and return true', async () => {
            const p = await serviceInstance.createProject('To Delete', 'Desc', GameType.MEMORY, 'u1');

            // Verify project exists before deletion
            let allProjects = await serviceInstance.getAllProjects();
            expect(allProjects.length).toBe(1);

            const result = await serviceInstance.deleteProject(p.id);
            expect(result).toBe(true);

            // Verify project no longer exists
            allProjects = await serviceInstance.getAllProjects();
            expect(allProjects.length).toBe(0);

            const deletedProject = await serviceInstance.getProjectById(p.id);
            expect(deletedProject).toBeUndefined();
        });

        it('should return false if trying to delete a non-existent project', async () => {
            await serviceInstance.createProject('P1', 'D1', GameType.QUIZ, 'u1');

            // Verify we have one project
            const initialProjects = await serviceInstance.getAllProjects();
            expect(initialProjects.length).toBe(1);

            const result = await serviceInstance.deleteProject('non-existent-id');
            expect(result).toBe(false);

            // Verify no projects were deleted
            const afterProjects = await serviceInstance.getAllProjects();
            expect(afterProjects.length).toBe(1);
        });
    });
});