import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import app from '../app.js';
import connectDatabase from '../config/db.js';
import { sql } from 'slonik';
import jwt from 'jsonwebtoken';

describe('Canvas API', () => {
    let pool;
    let testUser;
    let authToken;
    let testCanvas;
    const testUserData = {
        name: 'Canvas Test User',
        email: 'canvastest@example.com',
        password: 'Test@1234'
    };
    const testCanvasData = {
        name: 'Test Canvas',
        description: 'Test Description',
        elements: [
            { type: 'rectangle', x: 10, y: 20, width: 100, height: 50 },
            { type: 'circle', x: 50, y: 50, radius: 25 }
        ],
        background_color: '#ffffff',
        shared_with_ids: []
    };

    beforeAll(async () => {
        pool = await connectDatabase();
    });

    afterAll(async () => {
        // Clean up test data
        if (testCanvas) {
            try {
                await pool.query(sql.unsafe`DELETE FROM canvas WHERE id = ${testCanvas.id}`);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
        if (testUser) {
            try {
                await pool.query(sql.unsafe`DELETE FROM users WHERE email = ${testUserData.email}`);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
        await pool.end();
    });

    beforeEach(async () => {
        // Clean up before each test
        try {
            await pool.query(sql.unsafe`DELETE FROM canvas WHERE owner_id IN (SELECT id FROM users WHERE email = ${testUserData.email})`);
            await pool.query(sql.unsafe`DELETE FROM users WHERE email = ${testUserData.email}`);
        } catch (error) {
            // Ignore cleanup errors
        }

        // Register and login user for each test
        const registerResponse = await request(app)
            .post('/auth/register')
            .send(testUserData);

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: testUserData.email,
                password: testUserData.password
            });

        authToken = loginResponse.body.token;
        testUser = loginResponse.body.user;
    });

    describe('POST /canvas/create', () => {
        it('should create a canvas successfully', async () => {
            const response = await request(app)
                .post('/canvas/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testCanvasData)
                .expect(201);

            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('canvas');
            expect(response.body.canvas).toHaveProperty('id');
            expect(response.body.canvas.name).toBe(testCanvasData.name);
            expect(response.body.canvas.owner_id).toBe(testUser.id);
            expect(response.body.canvas.elements).toEqual(testCanvasData.elements);
            
            testCanvas = response.body.canvas;
        });

        it('should create canvas with shared users', async () => {
            // Create another user to share with
            let otherUserId;
            const otherUser = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Other User',
                    email: 'othercanvas@example.com',
                    password: 'Test@1234'
                });

            if (otherUser.status === 201 && otherUser.body.user) {
                otherUserId = otherUser.body.user.id;
            } else {
                // If registration failed (user exists), login to get user ID
                const otherLogin = await request(app)
                    .post('/auth/login')
                    .send({
                        email: 'othercanvas@example.com',
                        password: 'Test@1234'
                    });
                otherUserId = otherLogin.body.user.id;
            }

            const canvasData = {
                ...testCanvasData,
                shared_with_ids: [otherUserId]
            };

            const response = await request(app)
                .post('/canvas/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(canvasData)
                .expect(201);

            expect(response.body.canvas.shared_with_ids).toContain(otherUserId);
        });

        it('should return 401 without authentication token', async () => {
            await request(app)
                .post('/canvas/create')
                .send(testCanvasData)
                .expect(401);
        });

        it('should return 401 with invalid token', async () => {
            await request(app)
                .post('/canvas/create')
                .set('Authorization', 'Bearer invalid-token')
                .send(testCanvasData)
                .expect(401);
        });

        it('should create canvas with minimal data', async () => {
            const minimalData = {
                name: 'Minimal Canvas'
            };

            const response = await request(app)
                .post('/canvas/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(minimalData)
                .expect(201);

            expect(response.body.canvas.name).toBe('Minimal Canvas');
            expect(response.body.canvas.owner_id).toBe(testUser.id);
        });
    });

    describe('GET /canvas/get/:id', () => {
        beforeEach(async () => {
            // Create a canvas before get tests
            const createResponse = await request(app)
                .post('/canvas/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testCanvasData);
            
            testCanvas = createResponse.body.canvas;
        });

        it('should get canvas by ID with valid token', async () => {
            const response = await request(app)
                .get(`/canvas/get/${testCanvas.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('canvas');
            expect(response.body.canvas.id).toBe(testCanvas.id);
            expect(response.body.canvas.name).toBe(testCanvasData.name);
        });

        it('should return 404 for non-existent canvas', async () => {
            await request(app)
                .get('/canvas/get/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should return 401 without authentication token', async () => {
            await request(app)
                .get(`/canvas/get/${testCanvas.id}`)
                .expect(401);
        });
    });

    describe('GET /canvas/get-all', () => {
        beforeEach(async () => {
            // Create multiple canvases
            for (let i = 0; i < 3; i++) {
                await request(app)
                    .post('/canvas/create')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        ...testCanvasData,
                        name: `Test Canvas ${i + 1}`
                    });
            }
        });

        it('should get all canvases with valid token', async () => {
            const response = await request(app)
                .get('/canvas/get-all')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('canvases');
            expect(Array.isArray(response.body.canvases)).toBe(true);
            expect(response.body.canvases.length).toBeGreaterThanOrEqual(3);
        });

        it('should return 401 without authentication token', async () => {
            await request(app)
                .get('/canvas/get-all')
                .expect(401);
        });
    });

    describe('GET /canvas/get-all-by-owner-id', () => {
        beforeEach(async () => {
            // Create canvases for the test user
            for (let i = 0; i < 2; i++) {
                await request(app)
                    .post('/canvas/create')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        ...testCanvasData,
                        name: `Owner Canvas ${i + 1}`
                    });
            }

            // Create another user and their canvas
            const otherUser = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Other User',
                    email: 'othercanvas2@example.com',
                    password: 'Test@1234'
                });

            const otherLogin = await request(app)
                .post('/auth/login')
                .send({
                    email: 'othercanvas2@example.com',
                    password: 'Test@1234'
                });

            await request(app)
                .post('/canvas/create')
                .set('Authorization', `Bearer ${otherLogin.body.token}`)
                .send({
                    ...testCanvasData,
                    name: 'Other User Canvas'
                });
        });

        it('should get only canvases owned by authenticated user', async () => {
            const response = await request(app)
                .get('/canvas/get-all-by-owner-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('canvases');
            expect(Array.isArray(response.body.canvases)).toBe(true);
            // Should only return canvases owned by testUser
            response.body.canvases.forEach(canvas => {
                expect(canvas.owner_id).toBe(testUser.id);
            });
        });

        it('should return 401 without authentication token', async () => {
            await request(app)
                .get('/canvas/get-all-by-owner-id')
                .expect(401);
        });
    });

    describe('GET /canvas/get-all-by-shared-with-ids', () => {
        let sharedUserId;
        
        beforeEach(async () => {
            // Clean up shared user if exists
            try {
                await pool.query(sql.unsafe`DELETE FROM canvas WHERE owner_id IN (SELECT id FROM users WHERE email = 'shareduser@example.com')`);
                await pool.query(sql.unsafe`DELETE FROM users WHERE email = 'shareduser@example.com'`);
            } catch (error) {
                // Ignore cleanup errors
            }

            // Create another user
            const otherUser = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Shared User',
                    email: 'shareduser@example.com',
                    password: 'Test@1234'
                });

            // Get user ID from registration or login
            if (otherUser.status === 201 && otherUser.body && otherUser.body.user) {
                sharedUserId = otherUser.body.user.id;
            } else {
                // If registration failed (user exists), login to get user ID
                const otherLogin = await request(app)
                    .post('/auth/login')
                    .send({
                        email: 'shareduser@example.com',
                        password: 'Test@1234'
                    });
                if (otherLogin.status === 200 && otherLogin.body && otherLogin.body.user) {
                    sharedUserId = otherLogin.body.user.id;
                } else {
                    throw new Error('Failed to get shared user ID');
                }
            }

            // Create a canvas shared with the other user
            await request(app)
                .post('/canvas/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...testCanvasData,
                    name: 'Shared Canvas',
                    shared_with_ids: [sharedUserId]
                });

            // Create a canvas not shared
            await request(app)
                .post('/canvas/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...testCanvasData,
                    name: 'Not Shared Canvas',
                    shared_with_ids: []
                });
        });

        it('should get canvases shared with authenticated user', async () => {
            // Login as the shared user
            const sharedUserLogin = await request(app)
                .post('/auth/login')
                .send({
                    email: 'shareduser@example.com',
                    password: 'Test@1234'
                });

            const response = await request(app)
                .get('/canvas/get-all-by-shared-with-ids')
                .set('Authorization', `Bearer ${sharedUserLogin.body.token}`)
                .expect(200);

            expect(response.body).toHaveProperty('canvases');
            expect(Array.isArray(response.body.canvases)).toBe(true);
            // Should only return canvases shared with this user
            response.body.canvases.forEach(canvas => {
                expect(canvas.shared_with_ids).toContain(sharedUserLogin.body.user.id);
            });
        });

        it('should return empty array if no canvases are shared', async () => {
            const response = await request(app)
                .get('/canvas/get-all-by-shared-with-ids')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.canvases).toEqual([]);
        });

        it('should return 401 without authentication token', async () => {
            await request(app)
                .get('/canvas/get-all-by-shared-with-ids')
                .expect(401);
        });
    });
});
