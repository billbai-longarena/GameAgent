import { NextResponse } from 'next/server';
import { projectService } from '@/services/project.service';
import { GameType, ProjectStatus, DevelopmentStage } from '@/types/project'; // For request body validation

interface Params {
    id: string;
}

export async function GET(request: Request, context: { params: Params }) {
    try {
        const projectId = context.params.id;
        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        const project = await projectService.getProjectById(projectId);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        return NextResponse.json(project);
    } catch (error: any) {
        console.error(`API Route (projects/[id] GET): Error fetching project ${context.params.id}:`, error.message);
        return NextResponse.json({ error: `Failed to fetch project: ${error.message}` }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: Params }) {
    try {
        const projectId = context.params.id;
        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        const body = await request.json();
        // Validate fields if necessary, e.g., gameType, status, currentStage
        if (body.gameType && !Object.values(GameType).includes(body.gameType as GameType)) {
            return NextResponse.json({ error: 'Invalid gameType' }, { status: 400 });
        }
        if (body.status && !Object.values(ProjectStatus).includes(body.status as ProjectStatus)) {
            return NextResponse.json({ error: 'Invalid project status' }, { status: 400 });
        }
        if (body.currentStage && !Object.values(DevelopmentStage).includes(body.currentStage as DevelopmentStage)) {
            return NextResponse.json({ error: 'Invalid development stage' }, { status: 400 });
        }

        // Ensure id, createdAt, userId are not updatable through this endpoint directly
        const { id, createdAt, userId, ...validUpdates } = body;

        const updatedProject = await projectService.updateProject(projectId, validUpdates);
        if (!updatedProject) {
            return NextResponse.json({ error: 'Project not found or update failed' }, { status: 404 });
        }
        return NextResponse.json(updatedProject);
    } catch (error: any) {
        console.error(`API Route (projects/[id] PUT): Error updating project ${context.params.id}:`, error.message);
        return NextResponse.json({ error: `Failed to update project: ${error.message}` }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Params }) {
    try {
        const projectId = context.params.id;
        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        const success = await projectService.deleteProject(projectId);
        if (!success) {
            return NextResponse.json({ error: 'Project not found or delete failed' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Project deleted successfully' }, { status: 200 }); // Or 204 No Content
    } catch (error: any) {
        console.error(`API Route (projects/[id] DELETE): Error deleting project ${context.params.id}:`, error.message);
        return NextResponse.json({ error: `Failed to delete project: ${error.message}` }, { status: 500 });
    }
}
