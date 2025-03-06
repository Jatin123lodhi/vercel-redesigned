const express = require('express');
const httpProxy = require('http-proxy');
require('dotenv').config();

const app = express();
const port = 8000;

// Debug logging for environment variables
console.log('Environment Variables:');
console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);
console.log('S3_REGION:', process.env.S3_REGION);
console.log('S3_OUTPUT_PATH:', process.env.S3_OUTPUT_PATH);
console.log('AWS_S3_BASE_URL:', process.env.AWS_S3_BASE_URL);

// Construct the base URL from environment variables
const BASE_URL = `${process.env.AWS_S3_BASE_URL}/${process.env.S3_OUTPUT_PATH}`;
console.log('Final BASE_URL:', BASE_URL);

const proxy = httpProxy.createProxy()

// Log when a proxy request is initiated
proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if(url === '/'){
        proxyReq.path += 'index.html';
        console.log(`Modified path for root: ${proxyReq.path}`);
    }
})

// Log successful proxy responses
proxy.on('proxyRes', (proxyRes, req, res) => {
    console.log(`Response Status: ${proxyRes.statusCode}`);
    
    if (proxyRes.statusCode >= 400) {
        let body = '';
        proxyRes.on('data', chunk => {
            body += chunk;
        });
        proxyRes.on('end', () => {
            try {
                const parsedBody = JSON.parse(body);
                console.log('Parsed Error:', parsedBody);
            } catch (e) {
                console.log('Raw Error Body:', body);
            }
        });
    }
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).json({
        error: 'Proxy Error',
        message: err.message,
        code: err.code
    });
});

app.use((req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];
    const resolvesTo = `${BASE_URL}/${subdomain}`;
    console.log('Proxying to:', resolvesTo);
    
    proxy.web(req, res, { 
        target: resolvesTo, 
        changeOrigin: true,
        timeout: 5000 // 5 second timeout
    });
}) 

app.listen(port, () => {
    console.log(`Reverse Proxy is running on port ${port}`);
    console.log(`Base URL: ${BASE_URL}`);
});

