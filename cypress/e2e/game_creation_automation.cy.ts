import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { GameType } from '../../src/types/project';

describe('自动化游戏创建流程', () => {
    const testProjectId = `test-project-${Date.now()}`;
    const testUserId = 'test-user-id';
    let clientSocket: ClientSocket | null = null;
    let gamePreviewUrl: string | null = null;
    let createdFiles: any[] = [];

    beforeEach(() => {
        // 访问页面以确保应用和服务器（包括WebSocket）已准备就绪
        cy.visit('/');

        // 创建测试项目
        cy.request({
            method: 'POST',
            url: '/api/projects',
            body: {
                name: '高中生物学细胞结构学习游戏',
                description: '一个帮助学生学习细胞结构的拖放游戏',
                gameType: GameType.DRAG_DROP,
                userId: testUserId,
                tags: ['生物学', '教育', '高中']
            }
        }).then((response) => {
            expect(response.status).to.equal(201);
            expect(response.body).to.have.property('id');
            // 使用响应中的项目ID替换测试项目ID
            cy.wrap(response.body.id).as('actualProjectId');
        });

        // 建立WebSocket连接
        cy.get('@actualProjectId').then((actualProjectId) => {
            const projectId = actualProjectId as unknown as string;
            cy.wrap(new Promise<ClientSocket>((resolve, reject) => {
                const socketUrl = Cypress.config('baseUrl') || 'http://localhost:3000';
                const socket = ClientIO(`${socketUrl}/agent`, {
                    query: { projectId },
                    transports: ['websocket'],
                    forceNew: true,
                    reconnection: false,
                });

                socket.on('connect', () => {
                    console.log(`[Cypress Test] WebSocket client connected for project: ${projectId}`);
                    clientSocket = socket;
                    resolve(socket);
                });

                socket.on('connect_error', (err) => {
                    console.error('[Cypress Test] WebSocket client connection error:', err);
                    clientSocket = null;
                    reject(err);
                });

                // 连接超时
                setTimeout(() => {
                    if (!socket.connected) {
                        reject(new Error('[Cypress Test] WebSocket connection timed out after 5 seconds.'));
                    }
                }, 5000);
            }), { timeout: 7000 })
                .should('not.be.null')
                .and('have.property', 'connected', true);
        });
    });

    afterEach(() => {
        // 断开WebSocket连接
        if (clientSocket && clientSocket.connected) {
            cy.get('@actualProjectId').then((actualProjectId) => {
                const projectId = actualProjectId as unknown as string;
                console.log(`[Cypress Test] Disconnecting WebSocket client for project: ${projectId}`);
                clientSocket!.disconnect();
            });
        }
        clientSocket = null;

        // 清理测试项目（可选，取决于是否需要保留测试项目以供手动检查）
        // cy.get('@actualProjectId').then((actualProjectId) => {
        //     const projectId = actualProjectId as unknown as string;
        //     cy.request({
        //         method: 'DELETE',
        //         url: `/api/projects/${projectId}`,
        //     }).then((response) => {
        //         expect(response.status).to.equal(200);
        //     });
        // });
    });

    it('应该能够通过自然语言指令自动创建游戏', (done) => {
        cy.get('@actualProjectId').then((actualProjectId) => {
            const projectId = actualProjectId as unknown as string;
            if (!clientSocket) {
                return done(new Error('[Cypress Test] WebSocket client not initialized in test body.'));
            }

            // 设置事件监听器和状态跟踪变量
            let receivedThinkingEvent = false;
            let receivedActionEvent = false;
            let receivedProgressEvent = false;
            let receivedFileCreatedEvent = false;
            let receivedPreviewUpdatedEvent = false;
            let agentCompletedStatus = false;

            // 监听思考过程事件
            clientSocket.on('agent:thinking', (data: { projectId: string; thinking: string }) => {
                console.log(`[Cypress Test] Received agent:thinking event:`, data);
                try {
                    expect(data.projectId).to.equal(projectId);
                    expect(data.thinking).to.be.a('string');
                    receivedThinkingEvent = true;
                } catch (e) {
                    clientSocket!.off('agent:thinking');
                    return done(e);
                }
            });

            // 监听执行操作事件
            clientSocket.on('agent:action', (data: { projectId: string; action: any }) => {
                console.log(`[Cypress Test] Received agent:action event:`, data);
                try {
                    expect(data.projectId).to.equal(projectId);
                    expect(data.action).to.be.an('object');
                    receivedActionEvent = true;

                    // 检查是否完成
                    if (data.action.type === 'agent_response' &&
                        data.action.description.includes('completed') &&
                        data.action.description.toLowerCase().includes('game')) {
                        agentCompletedStatus = true;
                        checkAllEventsReceived();
                    }
                } catch (e) {
                    clientSocket!.off('agent:action');
                    return done(e);
                }
            });

            // 监听进度更新事件
            clientSocket.on('agent:progress', (data: { projectId: string; stage: string; progress: number; timeRemaining: number }) => {
                console.log(`[Cypress Test] Received agent:progress event:`, data);
                try {
                    expect(data.projectId).to.equal(projectId);
                    expect(data.progress).to.be.a('number');
                    receivedProgressEvent = true;
                } catch (e) {
                    clientSocket!.off('agent:progress');
                    return done(e);
                }
            });

            // 监听文件创建事件
            clientSocket.on('file:created', (data: { projectId: string; file: any }) => {
                console.log(`[Cypress Test] Received file:created event:`, data);
                try {
                    expect(data.projectId).to.equal(projectId);
                    expect(data.file).to.be.an('object');
                    createdFiles.push(data.file);
                    receivedFileCreatedEvent = true;
                } catch (e) {
                    clientSocket!.off('file:created');
                    return done(e);
                }
            });

            // 监听预览更新事件
            clientSocket.on('preview:updated', (data: { projectId: string; url: string }) => {
                console.log(`[Cypress Test] Received preview:updated event:`, data);
                try {
                    expect(data.projectId).to.equal(projectId);
                    expect(data.url).to.be.a('string');
                    gamePreviewUrl = data.url;
                    receivedPreviewUpdatedEvent = true;
                } catch (e) {
                    clientSocket!.off('preview:updated');
                    return done(e);
                }
            });

            // 检查是否收到所有预期的事件
            const checkAllEventsReceived = () => {
                if (receivedThinkingEvent &&
                    receivedActionEvent &&
                    receivedProgressEvent &&
                    receivedFileCreatedEvent &&
                    receivedPreviewUpdatedEvent &&
                    agentCompletedStatus) {

                    // 验证创建的文件
                    expect(createdFiles.length).to.be.greaterThan(0);

                    // 验证游戏预览URL
                    expect(gamePreviewUrl).to.be.a('string');

                    // 测试成功完成
                    done();
                }
            };

            // 获取Agent状态以确保初始化
            cy.request({
                method: 'GET',
                url: `/api/agent/status?projectId=${projectId}`,
            }).then((response) => {
                expect(response.status).to.equal(200);
                expect(response.body).to.have.property('status');

                // 发送游戏创建指令
                cy.request({
                    method: 'POST',
                    url: '/api/agent/control',
                    body: {
                        projectId: projectId,
                        action: 'start',
                        instruction: '我需要一个针对高中生物学的细胞结构学习游戏，学生需要将细胞各部分组件拖放到正确位置，并回答关于每个组件功能的问题。游戏应该包含细胞膜、细胞核、线粒体、内质网、高尔基体等主要细胞器，每个部分都应该有简短的功能描述。'
                    }
                }).then((response) => {
                    expect(response.status).to.equal(200);
                    expect(response.body).to.have.property('success', true);

                    // 设置测试超时，如果超过指定时间仍未收到所有事件，则测试失败
                    cy.wait(60000).then(() => {
                        if (!receivedThinkingEvent ||
                            !receivedActionEvent ||
                            !receivedProgressEvent ||
                            !receivedFileCreatedEvent ||
                            !receivedPreviewUpdatedEvent ||
                            !agentCompletedStatus) {
                            done(new Error('[Cypress Test] Timeout waiting for all expected events.'));
                        }
                    });
                });
            });
        });
    });
});
