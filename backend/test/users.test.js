import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import app from '../app.js';
import connectDatabase from '../config/db.js';
import { sql } from 'slonik';
import jwt from 'jsonwebtoken';

describe('Users API', () => {
    let pool;
    let testUser;
    let authToken;
    const testUserData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234'
    };

    beforeAll(async () => {
        pool = await connectDatabase();
    });

    afterAll(async () => {
        // Clean up test data
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
            await pool.query(sql.unsafe`DELETE FROM users WHERE email = ${testUserData.email}`);
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send(testUserData)
                .expect(201);

            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user.email).toBe(testUserData.email);
            expect(response.body.user.name).toBe(testUserData.name);
            expect(response.body.user).not.toHaveProperty('password');
            
            testUser = response.body.user;
        });

        it('should return 400 for invalid email format', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Test User',
                    email: 'invalid-email',
                    password: 'Test@1234'
                })
                .expect(400);

            expect(response.body).toHaveProperty('errors');
        });

        it('should return 400 for weak password', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test2@example.com',
                    password: 'weak'
                })
                .expect(400);

            expect(response.body).toHaveProperty('errors');
        });

        it('should return 500 for duplicate email', async () => {
            // Register first user
            await request(app)
                .post('/auth/register')
                .send(testUserData);

            // Try to register with same email
            const response = await request(app)
                .post('/auth/register')
                .send(testUserData)
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            // Register a user before login tests
            const registerResponse = await request(app)
                .post('/auth/register')
                .send(testUserData);
            testUser = registerResponse.body.user;
        });

        it('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testUserData.email,
                    password: testUserData.password
                })
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe(testUserData.email);
            expect(response.body.user).not.toHaveProperty('password');
            
            authToken = response.body.token;
        });

        it('should return 400 for missing email or password', async () => {
            await request(app)
                .post('/auth/login')
                .send({ email: testUserData.email })
                .expect(400);

            await request(app)
                .post('/auth/login')
                .send({ password: testUserData.password })
                .expect(400);
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testUserData.email,
                    password: 'WrongPassword@123'
                })
                .expect(401);

            expect(response.body).toHaveProperty('message');
        });

        it('should return 401 for non-existent user', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Test@1234'
                })
                .expect(401);

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('GET /auth/profile', () => {
        beforeEach(async () => {
            // Register and login before profile tests
            await request(app)
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

        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.email).toBe(testUserData.email);
            expect(response.body).not.toHaveProperty('password');
        });

        it('should return 401 without token', async () => {
            await request(app)
                .get('/auth/profile')
                .expect(401);
        });

        it('should return 401 with invalid token', async () => {
            await request(app)
                .get('/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('GET /auth/:id', () => {
        beforeEach(async () => {
            // Register and login
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

        it('should get user by ID with valid token', async () => {
            const response = await request(app)
                .get(`/auth/${testUser.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id', testUser.id);
            expect(response.body.email).toBe(testUserData.email);
        });

        it('should return 404 for non-existent user', async () => {
            await request(app)
                .get('/auth/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('PUT /auth/:id', () => {
        beforeEach(async () => {
            // Register and login
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

        it('should update user with valid token', async () => {
            const response = await request(app)
                .put(`/auth/${testUser.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Updated Name',
                    email: testUserData.email
                })
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user.name).toBe('Updated Name');
        });

        it('should return 403 when trying to update another user', async () => {
            // Create another user
            let otherUserId;
            const otherUser = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Other User',
                    email: 'other@example.com',
                    password: 'Test@1234'
                });

            if (otherUser.status === 201 && otherUser.body && otherUser.body.user) {
                otherUserId = otherUser.body.user.id;
            } else {
                // If registration failed (user exists), login to get user ID
                const otherLogin = await request(app)
                    .post('/auth/login')
                    .send({
                        email: 'other@example.com',
                        password: 'Test@1234'
                    });
                if (otherLogin.status === 200 && otherLogin.body && otherLogin.body.user) {
                    otherUserId = otherLogin.body.user.id;
                } else {
                    throw new Error('Failed to get other user ID');
                }
            }

            await request(app)
                .put(`/auth/${otherUserId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Hacked Name' })
                .expect(403);
        });
    });

    describe('PUT /auth/:id/password', () => {
        beforeEach(async () => {
            // Register and login
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

        it('should update password with valid old password', async () => {
            const response = await request(app)
                .put(`/auth/${testUser.id}/password`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    oldPassword: testUserData.password,
                    newPassword: 'NewPassword@123'
                })
                .expect(200);

            expect(response.body).toHaveProperty('message');
        });

        it('should return error with incorrect old password', async () => {
            const response = await request(app)
                .put(`/auth/${testUser.id}/password`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    oldPassword: 'WrongPassword@123',
                    newPassword: 'NewPassword@123'
                })
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('DELETE /auth/:id', () => {
        beforeEach(async () => {
            // Register and login
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

        it('should delete user with valid token', async () => {
            const response = await request(app)
                .delete(`/auth/${testUser.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message');

            // Verify user is deleted - token will be invalid after deletion, so expect 401
            await request(app)
                .get(`/auth/${testUser.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(401);
        });
    });
});
