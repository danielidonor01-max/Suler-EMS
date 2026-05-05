const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const logPath = 'C:\\Users\\Daniel Idonor\\.gemini\\antigravity\\brain\\422fb1ea-708c-4342-8c85-3e2956d6998b\\.system_generated\\logs\\overview.txt';
const outputDir = 'C:\\Users\\Daniel Idonor\\Suler EMS\\stitch_exports';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const logData = fs.readFileSync(logPath, 'utf-8');
const lines = logData.split('\n');

const screens = {};

for (const line of lines) {
    if (line.includes('{"name":"projects/10060942381596852301/screens/')) {
        try {
            // Find the start of the JSON object
            const startIndex = line.indexOf('{"name":"projects/10060942381596852301/screens/');
            const jsonStr = line.substring(startIndex);
            const obj = JSON.parse(jsonStr);
            if (obj.name && obj.title && obj.screenshot && obj.screenshot.downloadUrl) {
                screens[obj.name] = obj;
            }
        } catch (e) {
            // console.log("Failed to parse:", line.substring(0, 100));
        }
    }
}

console.log(`Found ${Object.keys(screens).length} unique screens in logs.`);

const screenList = Object.values(screens);

screenList.forEach(screen => {
    let safeTitle = screen.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const id = screen.name.split('/').pop();
    // Trim title if too long
    if (safeTitle.length > 50) safeTitle = safeTitle.substring(0, 50);
    
    const imgPath = path.join(outputDir, `${safeTitle}_${id}.png`);
    const htmlPath = path.join(outputDir, `${safeTitle}_${id}.html`);
    
    console.log(`Downloading ${screen.title}...`);
    
    try {
        if (screen.screenshot && screen.screenshot.downloadUrl && !fs.existsSync(imgPath)) {
            child_process.execSync(`curl -sSL "${screen.screenshot.downloadUrl}" -o "${imgPath}"`);
        }
        if (screen.htmlCode && screen.htmlCode.downloadUrl && !fs.existsSync(htmlPath)) {
            child_process.execSync(`curl -sSL "${screen.htmlCode.downloadUrl}" -o "${htmlPath}"`);
        }
        console.log(`Successfully downloaded ${screen.title}`);
    } catch (e) {
        console.error(`Failed to download ${screen.title}:`, e.message);
    }
});

console.log('All downloads completed.');
