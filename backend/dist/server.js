"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const index_js_1 = require("./config/index.js");
const mongo_js_1 = require("./database/mongo.js");
const store_js_1 = require("./data/store.js");
const startServer = async () => {
    // 1. Connect to MongoDB Compass (splitmate database)
    const connected = await (0, mongo_js_1.connectMongoDB)();
    if (connected) {
        await store_js_1.store.reloadFromMongo();
    }
    // 2. Initialize Express application
    const app = (0, app_js_1.createApp)();
    const server = app.listen(index_js_1.config.port, '0.0.0.0', () => {
        console.log('\n======================================================');
        console.log('🚀 SplitMate REST API Server is Live!');
        console.log(`📡 Local Server URL:       http://localhost:${index_js_1.config.port}`);
        console.log(`🤖 Android Emulator URL:   http://10.0.2.2:${index_js_1.config.port}/api/v1`);
        console.log(`🍏 iOS Simulator URL:      http://localhost:${index_js_1.config.port}/api/v1`);
        console.log(`❤️  Health Check:           http://localhost:${index_js_1.config.port}/health`);
        console.log(`🌐 Base API Endpoint:      http://localhost:${index_js_1.config.port}/api/v1`);
        console.log(`🍃 MongoDB Compass URI:    ${index_js_1.config.mongoUri}`);
        console.log(`💾 Storage Mode:           MongoDB (Direct Database Engine - Zero Local JSON Files)`);
        console.log('======================================================\n');
    });
    // Handle graceful shutdown
    const shutdown = () => {
        console.log('\n[SplitMate API] Shutting down server gracefully...');
        server.close(() => {
            console.log('[SplitMate API] Server closed successfully.');
            process.exit(0);
        });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
};
startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
