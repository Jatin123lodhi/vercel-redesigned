const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const mime = require('mime-types')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Redis = require('ioredis');
require('dotenv').config();  // Enable this line to use environment variables

// Use environment variables instead of hardcoded values
const REDIS_URL = process.env.REDIS_URL;
const AWS_REGION = process.env.AWS_REGION;
const S3_BUCKET = process.env.S3_BUCKET;
const PROJECT_ID = process.env.PROJECT_ID;

const publisher = new Redis(REDIS_URL);

const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const publishLog = (message) => {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({message}))
}


// build project and push to s3
async function buildProject() {
    console.log('Executing script.js')
    publishLog('Build started')

    const outputDir = path.join(__dirname, 'output');

    const p = exec(`cd ${outputDir} && npm install && npm run build`);

    p.stdout.on('data', (data) => {
        console.log(data.toString())
        publishLog(data.toString())
    })
    p.stderr.on('error', (data) => {
        console.log(data.toString())
        publishLog(`Error: ${data.toString()}`)
    })
    p.on('close', async (code) => {
        try {
            console.log('Build completed')
            publishLog('Build completed')
            const outputDistDir = path.join(__dirname, 'output', 'dist');
            const contents = fs.readdirSync(outputDistDir, {recursive: true})

            publishLog('Starting to upload')
            for(const file of contents) {
                const fullPath = path.join(outputDistDir, file)
                if(fs.lstatSync(fullPath).isDirectory()){
                    continue;
                }

                console.log('uploading', file)
                publishLog(`uploading ${file}`)
                const command = new PutObjectCommand({
                    Bucket: S3_BUCKET,
                    Key: `__output/${PROJECT_ID}/${file}`,
                    Body: fs.createReadStream(fullPath),
                    ContentType: mime.lookup(fullPath) || 'application/octet-stream',
                })
                await s3Client.send(command)
                console.log('uploaded', file)
                publishLog(`uploaded ${file}`)
            }
            console.log('Done ...')
            publishLog('Done ...')
            
            // Cleanup and exit
            await publisher.quit();  // Properly close Redis connection
            console.log('Redis connection closed');
            process.exit(0);  // Exit with success code
        } catch (error) {
            console.error('Error during upload:', error);
            publishLog(`Error during upload: ${error.message}`);
            await publisher.quit();
            process.exit(1);  // Exit with error code
        }
    })
   
}

buildProject();
