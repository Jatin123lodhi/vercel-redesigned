const express = require('express');
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');
const { generateSlug } = require('random-word-slugs')
const Redis = require('ioredis')
const { createServer } = require('http');
const { Server } = require('socket.io')
const cors = require('cors')
require('dotenv').config()

const app = express();
const port = process.env.PORT || 9000;

app.use(cors())
app.use(express.json());

// log aws credentials
console.log(process.env.AWS_ACCESS_KEY, process.env.AWS_SECRET_KEY);

const ecsClient = new ECSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
})

app.post('/project', async (req, res) => {
    const { gitURL, slug } = req.body;
    const projectSlug = slug || generateSlug();

    const command = new RunTaskCommand({
        cluster: process.env.ECS_CLUSTER,
        taskDefinition: process.env.ECS_TASK,
        launchType: "FARGATE",
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: [
                    process.env.ECS_SUBNET_1,
                    process.env.ECS_SUBNET_2,
                    process.env.ECS_SUBNET_3
                ],
                securityGroups: [process.env.ECS_SECURITY_GROUP],
                assignPublicIp: 'ENABLED'
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: "builder-image",
                    environment: [
                        { name: "GIT_REPO_URL", value: gitURL },
                        { name: "PROJECT_ID", value: projectSlug }
                    ]
                }
            ]
        }
    })
    const response = await ecsClient.send(command);
    return res.json({ status: 'queued', data: { projectSlug, url: `http://${projectSlug}.localhost:8000` } });
});

app.get('/healthCheck', (req, res) => {
    res.send('ok');
});

// Socket.IO setup
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } })

io.on("connection", (socket) => {
    socket.on('subscribe', channel => {
        if (channel) {
            socket.join(channel);
        }
    })
});

// Redis subscriber setup
const redisSubscriber = new Redis(process.env.REDIS_URL);

const initRedisSubscriber = () => {
    redisSubscriber.psubscribe("logs:*", (err, count) => {
        if (err) {
            console.error("Redis Subscription Error:", err);
        } else {
            console.log(`✅ Subscribed to ${count} Redis channels.`);
        }
    });

    redisSubscriber.on("pmessage", (pattern, channel, message) => {
        const parsedMessage = JSON.parse(message);
        console.log(`📢 New Log from ${channel}:`, parsedMessage);
        
        // Check if this is a deployment complete message
        if (parsedMessage.message && parsedMessage.message.includes('Done ...')) {
            io.to(channel).emit("deployed", {
                message: "Deployment completed successfully"
            });
        }
        
        // Send all logs as before
        io.to(channel).emit("message", parsedMessage);
    });
};

initRedisSubscriber();

server.listen(port, () => {
    console.log(`API Server + Socket Server is running on port ${port}`);
});





