import { NextResponse } from 'next/server';
import { projectService } from '@/services/project.service';
import { GameType } from '@/types/project'; // For request body validation

export async function GET(request: Request) {
    try {
        // TODO: Implement fetching userId from auth session if needed for filtering
        // const { searchParams } = new URL(request.url);
        // const userId = searchParams.get('userId');
        const projects = await projectService.getAllProjects(/* userId */);
        return NextResponse.json(projects);
    } catch (error: any) {
        console.error('API Route (projects GET): Error fetching projects:', error.message);
        return NextResponse.json({ error: `Failed to fetch projects: ${error.message}` }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, gameType, userId, tags } = body;

        if (!name || !description || !gameType || !userId) {
            return NextResponse.json({ error: 'Missing required fields: name, description, gameType, userId' }, { status: 400 });
        }

        // Validate gameType
        if (!Object.values(GameType).includes(gameType as GameType)) {
            return NextResponse.json({ error: 'Invalid gameType' }, { status: 400 });
        }

        // TODO: Get userId from authenticated session instead of request body for security
        const newProject = await projectService.createProject(name, description, gameType as GameType, userId, tags);
        return NextResponse.json(newProject, { status: 201 });
    } catch (error: any) {
        console.error('API Route (projects POST): Error creating project:', error.message);
        return NextResponse.json({ error: `Failed to create project: ${error.message}` }, { status: 500 });
    }
}
