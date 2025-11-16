const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Visual Dashboard - Main route
router.get('/dashboard', (req, res) => {
  const dbStatus = db.getStatus();
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>🎬 Storyboard Backend Dashboard</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', system-ui, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: white;
                padding: 20px;
            }
            .container { 
                max-width: 1200px;
                margin: 0 auto;
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(15px);
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
            }
            .header h1 {
                font-size: 3em;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .stat-card {
                background: rgba(255,255,255,0.1);
                padding: 25px;
                border-radius: 15px;
                border: 1px solid rgba(255,255,255,0.2);
            }
            .stat-card h3 {
                color: #ffeb3b;
                margin-bottom: 15px;
                font-size: 1.3em;
            }
            .status-badge {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 25px;
                font-weight: bold;
                font-size: 0.9em;
            }
            .connected { background: #4CAF50; }
            .running { background: #2196F3; }
            .api-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }
            .api-card {
                background: rgba(255,255,255,0.1);
                padding: 15px;
                border-radius: 10px;
                border-left: 4px solid #ffeb3b;
            }
            .api-card h4 {
                color: #ffeb3b;
                margin-bottom: 8px;
            }
            .test-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.9em;
                margin-top: 10px;
                transition: all 0.3s ease;
            }
            .test-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: translateY(-1px);
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                opacity: 0.8;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎬 Storyboard Backend</h1>
                <p>Professional Film Production Management System</p>
                <p><strong>Developer:</strong> @vaishnav12200</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h3>🚀 Server Status</h3>
                    <p><strong>Status:</strong> <span class="status-badge running">RUNNING</span></p>
                    <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
                    <p><strong>Port:</strong> ${process.env.PORT || 5000}</p>
                    <p><strong>Uptime:</strong> ${hours}h ${minutes}m ${seconds}s</p>
                </div>

                <div class="stat-card">
                    <h3>🗄️ Database Status</h3>
                    <p><strong>Status:</strong> 
                        <span class="status-badge ${dbStatus.isConnected ? 'connected' : 'disconnected'}">
                            ${dbStatus.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                        </span>
                    </p>
                    <p><strong>Database:</strong> ${dbStatus.name || 'storyboard_db'}</p>
                    <p><strong>Host:</strong> MongoDB Atlas</p>
                </div>

                <div class="stat-card">
                    <h3>📊 System Resources</h3>
                    <p><strong>Node.js:</strong> ${process.version}</p>
                    <p><strong>Memory:</strong> ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB</p>
                    <p><strong>Platform:</strong> ${process.platform}</p>
                </div>
            </div>

            <div class="stat-card">
                <h3>🛠️ Your Storyboard API Endpoints</h3>
                <div class="api-grid">
                    <div class="api-card">
                        <h4>🔐 Authentication</h4>
                        <p>/api/auth/*</p>
                        <button class="test-btn" onclick="testEndpoint('/api/auth')">Test Auth</button>
                    </div>
                    <div class="api-card">
                        <h4>🎬 Storyboards</h4>
                        <p>/api/storyboard/*</p>
                        <button class="test-btn" onclick="testEndpoint('/api/storyboard')">Test Storyboard</button>
                    </div>
                    <div class="api-card">
                        <h4>📝 Scripts</h4>
                        <p>/api/script/*</p>
                        <button class="test-btn" onclick="testEndpoint('/api/script')">Test Script</button>
                    </div>
                    <div class="api-card">
                        <h4>📅 Schedule</h4>
                        <p>/api/schedule/*</p>
                        <button class="test-btn" onclick="testEndpoint('/api/schedule')">Test Schedule</button>
                    </div>
                    <div class="api-card">
                        <h4>💰 Budget</h4>
                        <p>/api/budget/*</p>
                        <button class="test-btn" onclick="testEndpoint('/api/budget')">Test Budget</button>
                    </div>
                    <div class="api-card">
                        <h4>📋 Shot Lists</h4>
                        <p>/api/shotlist/*</p>
                        <button class="test-btn" onclick="testEndpoint('/api/shotlist')">Test Shotlist</button>
                    </div>
                    <div class="api-card">
                        <h4>📍 Locations</h4>
                        <p>/api/location/*</p>
                        <button class="test-btn" onclick="testEndpoint('/api/location')">Test Location</button>
                    </div>
                    <div class="api-card">
                        <h4>📤 Export</h4>
                        <p>/api/export/*</p>
                        <button class="test-btn" onclick="testEndpoint('/api/export')">Test Export</button>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
                <p>Storyboard App Backend | <a href="https://github.com/vaishnav12200/storyboardapp" style="color: #ffeb3b;">GitHub Repository</a></p>
            </div>
        </div>

        <script>
            function testEndpoint(endpoint) {
                window.open(endpoint, '_blank');
            }
        </script>
    </body>
    </html>
  `;

  res.send(html);
});

module.exports = router;