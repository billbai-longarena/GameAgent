import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';

describe('WebSocket Initialization and Communication', () => {
    const projectId = 'e2e-test-project';
    let clientSocket: ClientSocket | null = null;

    beforeEach(() => {
        // Visit a page to ensure the app and its server (including WebSocket) are ready.
        // Cypress baseUrl should be configured to http://localhost:3000
        cy.visit('/');

        // Establish a new WebSocket connection for each test.
        // Using a Promise to handle the async nature of socket connection.
        cy.wrap(new Promise<ClientSocket>((resolve, reject) => {
            const socketUrl = Cypress.config('baseUrl') || 'http://localhost:3000';
            const socket = ClientIO(`${socketUrl}/agent`, {
                query: { projectId },
                transports: ['websocket'], // Prefer WebSocket transport
                forceNew: true, // Ensures a new connection
                reconnection: false, // Disable reconnection for tests
            });

            socket.on('connect', () => {
                console.log(`[Cypress Test] WebSocket client connected for project: ${projectId}`);
                clientSocket = socket;
                resolve(socket);
            });

            socket.on('connect_error', (err) => {
                console.error('[Cypress Test] WebSocket client connection error:', err);
                clientSocket = null; // Ensure clientSocket is null on error
                reject(err);
            });

            // Timeout for connection
            setTimeout(() => {
                if (!socket.connected) {
                    reject(new Error('[Cypress Test] WebSocket connection timed out after 5 seconds.'));
                }
            }, 5000);
        }), { timeout: 7000 }) // Cypress command timeout
            .should('not.be.null') // Ensures the promise resolved with a socket
            .and('have.property', 'connected', true); // Ensures the socket is connected
    });

    afterEach(() => {
        // Disconnect the WebSocket client after each test.
        if (clientSocket && clientSocket.connected) {
            console.log(`[Cypress Test] Disconnecting WebSocket client for project: ${projectId}`);
            clientSocket.disconnect();
        }
        clientSocket = null;
    });

    it('should receive agent state updates via WebSocket after a successful API call to /api/agent/status', (done) => {
        if (!clientSocket) {
            // This should not happen if beforeEach was successful
            return done(new Error('[Cypress Test] WebSocket client not initialized in test body.'));
        }

        let receivedExpectedMessage = false;
        const expectedEventNames = ['agent:thinking', 'agent:action', 'agent:progress', 'agent:log'];
        let receivedEventsCount = 0;

        // Listen for any of the expected agent state update events
        expectedEventNames.forEach(eventName => {
            clientSocket!.on(eventName, (data: { projectId: string;[key: string]: any }) => {
                console.log(`[Cypress Test] Received WebSocket event '${eventName}':`, data);
                try {
                    expect(data.projectId).to.equal(projectId);
                    // Add more specific assertions about the data content if necessary
                    receivedEventsCount++;
                    if (eventName === 'agent:thinking') { // For example, wait for a specific event or any event
                        receivedExpectedMessage = true;
                    }
                } catch (e) {
                    clientSocket!.off(eventName); // Stop listening to prevent multiple done() calls on error
                    return done(e); // Fail test if assertion fails
                }
            });
        });

        // Trigger the API call that should cause WebSocket messages to be sent
        cy.request({
            method: 'GET',
            url: `/api/agent/status?projectId=${projectId}`,
            failOnStatusCode: false, // Allow checking non-2xx responses
        }).then((response) => {
            try {
                // Assert that the API call itself was successful
                expect(response.status, `API /api/agent/status response status`).to.equal(200);

                // Wait a short period to allow WebSocket messages to be processed
                // This duration might need adjustment based on system performance
                cy.wait(1500).then(() => {
                    // Assert that at least one of the expected WebSocket messages was received
                    // Based on the current implementation, AgentController's constructor emits state.
                    expect(receivedEventsCount, 'Number of WebSocket events received').to.be.greaterThan(0);
                    expect(receivedExpectedMessage, 'Specific agent:thinking event received').to.be.true;
                    done(); // Indicate successful completion of the asynchronous test
                });
            } catch (e) {
                done(e); // Fail test if assertion fails
            }
        });
    });
});
