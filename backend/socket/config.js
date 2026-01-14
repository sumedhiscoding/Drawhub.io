/**
 * Socket.io configuration
 */
export const socketConfig = {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  // Add other Socket.io options here as needed
  pingTimeout: 60000,
  pingInterval: 25000
};
