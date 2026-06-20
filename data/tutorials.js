export const TUTORIAL_CATEGORIES = [
  { id: 'ec2', name: 'EC2 Hosting' },
  { id: 'cdn', name: 'CDN & Media' },
  { id: 'n8n', name: 'n8n Automation' },
  { id: 'ai', name: 'AI Services' },
  { id: 'api', name: 'API Integration' },
];

export const TUTORIALS = [
  {
    slug: 'ec2-ssh-connect',
    title: 'Connect to EC2 Instance via SSH',
    service: 'EC2 Hosting',
    category: 'ec2',
    excerpt: 'Connect securely to your EC2 instance from terminal, PuTTY, or VS Code.',
    languages: ['bash', 'javascript', 'python'],
    duration: '8 min',
  },
  {
    slug: 'ec2-deploy-nodejs',
    title: 'Deploy a Node.js App on EC2',
    service: 'EC2 Hosting',
    category: 'ec2',
    excerpt: 'Install Node.js, deploy your app, and run with PM2.',
    languages: ['bash', 'javascript', 'python'],
    duration: '12 min',
  },
  {
    slug: 'ec2-deploy-php',
    title: 'Deploy PHP & Laravel on EC2',
    service: 'EC2 Hosting',
    category: 'ec2',
    excerpt: 'Set up Nginx, PHP-FPM, and deploy a Laravel application.',
    languages: ['bash', 'php', 'python'],
    duration: '15 min',
  },
  {
    slug: 'ec2-deploy-python',
    title: 'Deploy Python Flask/Django on EC2',
    service: 'EC2 Hosting',
    category: 'ec2',
    excerpt: 'Configure Python environment and serve with Gunicorn.',
    languages: ['bash', 'python', 'javascript'],
    duration: '12 min',
  },
  {
    slug: 'cdn-upload-dashboard',
    title: 'Upload Media via Dashboard',
    service: 'CDN & Media Hosting',
    category: 'cdn',
    excerpt: 'Drag-and-drop uploads, credit usage, and asset management.',
    languages: ['javascript'],
    duration: '6 min',
  },
  {
    slug: 'cdn-api-integration',
    title: 'CDN API Integration',
    service: 'CDN & Media Hosting',
    category: 'cdn',
    excerpt: 'Upload, list, and delete assets using REST API and API keys.',
    languages: ['javascript', 'python', 'php', 'bash'],
    duration: '10 min',
  },
  {
    slug: 'n8n-first-workflow',
    title: 'Create Your First n8n Workflow',
    service: 'n8n Automation Hosting',
    category: 'n8n',
    excerpt: 'Build an automation workflow with triggers and HTTP nodes.',
    languages: ['javascript'],
    duration: '10 min',
  },
  {
    slug: 'ai-chatbot-embed',
    title: 'Embed AI Chatbot on Your Website',
    service: 'AI Chatbot Service',
    category: 'ai',
    excerpt: 'Add the chatbot widget to HTML, React, and WordPress sites.',
    languages: ['javascript', 'html', 'python'],
    duration: '8 min',
  },
  {
    slug: 'payg-ec2-calculator',
    title: 'Configure Pay-as-you-go EC2',
    service: 'Pay-as-you-go EC2',
    category: 'ec2',
    excerpt: 'Use the calculator, add to cart, and understand hourly billing.',
    languages: ['javascript', 'bash'],
    duration: '5 min',
  },
];

export const TUTORIAL_CONTENT = {
  'ec2-ssh-connect': {
    intro: 'After your EC2 instance is active, connect using the credentials in Dashboard → My Services.',
    steps: [
      'Copy IP address, username, and password from your service detail page.',
      'Ensure port 22 (SSH) is open in your firewall.',
      'Connect using your preferred method below.',
    ],
    code: {
      bash: `# Linux / macOS / Windows Terminal
ssh root@YOUR_SERVER_IP

# Custom SSH port
ssh -p 2222 root@YOUR_SERVER_IP

# Using SSH key
ssh -i ~/.ssh/id_rsa root@YOUR_SERVER_IP`,
      javascript: `// Node.js SSH connection (ssh2 package)
const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('Connected to EC2');
  conn.exec('uname -a', (err, stream) => {
    stream.on('data', (data) => console.log(data.toString()));
  });
}).connect({
  host: 'YOUR_SERVER_IP',
  port: 22,
  username: 'root',
  password: 'YOUR_PASSWORD'
});`,
      python: `# Python SSH (paramiko)
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('YOUR_SERVER_IP', username='root', password='YOUR_PASSWORD')

stdin, stdout, stderr = client.exec_command('uname -a')
print(stdout.read().decode())
client.close()`,
    },
  },
  'ec2-deploy-nodejs': {
    intro: 'Deploy a Node.js application on your Feed Forge EC2 instance.',
    steps: [
      'SSH into your EC2 instance.',
      'Install Node.js 20 LTS.',
      'Clone or upload your project.',
      'Install dependencies and start with PM2.',
    ],
    code: {
      bash: `# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Deploy app
cd /var/www/myapp
npm install
npm install -g pm2
pm2 start app.js --name myapp
pm2 save && pm2 startup`,
      javascript: `// package.json scripts
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}

// Basic Express server (server.js)
const express = require('express');
const app = express();
app.get('/', (req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Running on port 3000'));`,
      python: `# Optional: use Python to deploy via SSH automation
import subprocess
subprocess.run(['ssh', 'root@YOUR_IP', 'cd /var/www && npm install && pm2 restart all'])`,
    },
  },
  'cdn-api-integration': {
    intro: 'Use your CDN API key to upload and manage media programmatically.',
    steps: [
      'Create an API key in Dashboard → CDN → API Keys.',
      'Copy the key immediately — it is shown only once.',
      'Use the endpoints below with the X-API-Key header.',
    ],
    code: {
      javascript: `// Upload file via CDN API
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const res = await fetch('/api/cdn/upload', {
  method: 'POST',
  headers: { 'X-API-Key': 'qscdn_your_api_key' },
  body: formData,
});
const data = await res.json();
console.log(data.asset.cdnUrl);`,
      python: `import requests

with open('image.png', 'rb') as f:
    res = requests.post(
        'https://yourdomain.com/api/cdn/upload',
        headers={'X-API-Key': 'qscdn_your_api_key'},
        files={'file': f}
    )
print(res.json())`,
      php: `<?php
$ch = curl_init('https://yourdomain.com/api/cdn/upload');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['X-API-Key: qscdn_your_api_key'],
    CURLOPT_POSTFIELDS => ['file' => new CURLFile('image.png')],
    CURLOPT_RETURNTRANSFER => true,
]);
$response = curl_exec($ch);
echo $response;`,
      bash: `# Upload via cURL
curl -X POST https://yourdomain.com/api/cdn/upload \\
  -H "X-API-Key: qscdn_your_api_key" \\
  -F "file=@/path/to/image.png"`,
    },
  },
  'ai-chatbot-embed': {
    intro: 'Embed your AI Chatbot widget on any website after provisioning.',
    steps: [
      'Go to Dashboard → AI Chatbot Orders and copy your widget ID.',
      'Add the embed script to your website.',
      'Customize colors in your chatbot dashboard settings.',
    ],
    code: {
      javascript: `// React component
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://cdn.quantumserver.cloud/chatbot/widget.js';
  script.dataset.widgetId = 'YOUR_WIDGET_ID';
  document.body.appendChild(script);
}, []);`,
      html: `<!-- HTML embed -->
<script
  src="https://cdn.quantumserver.cloud/chatbot/widget.js"
  data-widget-id="YOUR_WIDGET_ID"
  async
></script>`,
      python: `# Flask template
# Add to base.html before </body>:
# <script src="https://cdn.quantumserver.cloud/chatbot/widget.js"
#         data-widget-id="{{ widget_id }}" async></script>`,
    },
  },
};

export function getTutorial(slug) {
  return TUTORIALS.find((t) => t.slug === slug);
}

export function getTutorialsByCategory(categoryId) {
  return TUTORIALS.filter((t) => t.category === categoryId);
}
