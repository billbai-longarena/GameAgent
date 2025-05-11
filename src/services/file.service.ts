import fs from 'fs/promises';
import path from 'path';
import { File, FileType } from '@/types/file'; // Assuming File and FileType are relevant for metadata

// Base path for file operations, could be configurable or derived
// For now, let's assume operations are relative to a 'workspace' directory within the project
// or directly within the 'gagent' app structure if files are part of the app itself.
// Let's define a root for user-generated project files.
// This should ideally be outside the `src` directory for Next.js projects if they are dynamic data.
// For example, `gagent/projects_data/[projectId]/...`
// For simplicity in this initial service, we'll assume paths passed are relative to the `gagent` app root.
// A more robust solution would involve a dedicated workspace root.
const GAGENT_APP_ROOT = process.cwd(); // This will be /Users/bingbingbai/Desktop/gameagent/gagent when run by Next.js

export class FileService {
    private resolvePath(relativePath: string): string {
        // Ensure the path is not attempting to escape the app root for security.
        // path.join will normalize, path.resolve will make it absolute from CWD.
        const resolvedPath = path.resolve(GAGENT_APP_ROOT, relativePath);
        if (!resolvedPath.startsWith(GAGENT_APP_ROOT)) {
            throw new Error(`Path traversal attempt detected: ${relativePath}`);
        }
        return resolvedPath;
    }

    async readFile(filePath: string): Promise<string> {
        const absolutePath = this.resolvePath(filePath);
        console.log(`FileService: Reading file at ${absolutePath}`);
        try {
            const content = await fs.readFile(absolutePath, 'utf-8');
            return content;
        } catch (error: any) {
            console.error(`FileService: Error reading file ${absolutePath}:`, error.message);
            throw new Error(`Failed to read file: ${filePath}. Error: ${error.message}`);
        }
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        const absolutePath = this.resolvePath(filePath);
        console.log(`FileService: Writing file to ${absolutePath}`);
        try {
            // Ensure directory exists
            const dirName = path.dirname(absolutePath);
            await this.createDirectory(path.relative(GAGENT_APP_ROOT, dirName)); // pass relative path to createDirectory
            await fs.writeFile(absolutePath, content, 'utf-8');
            console.log(`FileService: Successfully wrote file to ${absolutePath}`);
        } catch (error: any) {
            console.error(`FileService: Error writing file ${absolutePath}:`, error.message);
            throw new Error(`Failed to write file: ${filePath}. Error: ${error.message}`);
        }
    }

    async deleteFile(filePath: string): Promise<void> {
        const absolutePath = this.resolvePath(filePath);
        console.log(`FileService: Deleting file at ${absolutePath}`);
        try {
            await fs.unlink(absolutePath);
            console.log(`FileService: Successfully deleted file ${absolutePath}`);
        } catch (error: any) {
            console.error(`FileService: Error deleting file ${absolutePath}:`, error.message);
            if (error.code === 'ENOENT') { // File not found
                console.warn(`FileService: Attempted to delete non-existent file ${absolutePath}`);
                return; // Or throw a specific "file not found" error if preferred
            }
            throw new Error(`Failed to delete file: ${filePath}. Error: ${error.message}`);
        }
    }

    async createDirectory(dirPath: string): Promise<void> {
        const absolutePath = this.resolvePath(dirPath);
        console.log(`FileService: Creating directory at ${absolutePath}`);
        try {
            await fs.mkdir(absolutePath, { recursive: true });
            console.log(`FileService: Successfully created directory ${absolutePath}`);
        } catch (error: any) {
            console.error(`FileService: Error creating directory ${absolutePath}:`, error.message);
            throw new Error(`Failed to create directory: ${dirPath}. Error: ${error.message}`);
        }
    }

    async listFiles(dirPath: string): Promise<string[]> {
        const absolutePath = this.resolvePath(dirPath);
        console.log(`FileService: Listing files in directory ${absolutePath}`);
        try {
            const entries = await fs.readdir(absolutePath, { withFileTypes: true });
            // Filter out directories, return only file names
            const files = entries.filter(entry => entry.isFile()).map(entry => entry.name);
            return files;
        } catch (error: any) {
            console.error(`FileService: Error listing files in ${absolutePath}:`, error.message);
            throw new Error(`Failed to list files in directory: ${dirPath}. Error: ${error.message}`);
        }
    }

    async listDirectoryContents(dirPath: string): Promise<{ name: string, isDirectory: boolean }[]> {
        const absolutePath = this.resolvePath(dirPath);
        console.log(`FileService: Listing contents of directory ${absolutePath}`);
        try {
            const entries = await fs.readdir(absolutePath, { withFileTypes: true });
            return entries.map(entry => ({
                name: entry.name,
                isDirectory: entry.isDirectory(),
            }));
        } catch (error: any) {
            console.error(`FileService: Error listing directory contents ${absolutePath}:`, error.message);
            throw new Error(`Failed to list directory contents: ${dirPath}. Error: ${error.message}`);
        }
    }

    async fileExists(filePath: string): Promise<boolean> {
        const absolutePath = this.resolvePath(filePath);
        try {
            await fs.access(absolutePath);
            return true;
        } catch {
            return false;
        }
    }

    // TODO: Add methods for moving/renaming files/directories if needed
    // TODO: Add methods for getting file metadata (size, type, mtime) if needed
}

export const fileService = new FileService();
