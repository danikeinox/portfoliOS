import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();

const ignoredDirs = new Set([
    '.git',
    'node_modules',
    '.next',
    'out',
    'build',
    'dist',
    'coverage',
]);

const ignoredFiles = new Set([
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    '.env.test',
]);

const allowedExtensions = new Set([
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.json',
    '.md',
    '.mjs',
    '.cjs',
    '.yml',
    '.yaml',
]);

const includeRootFiles = new Set([
    'package.json',
    'README.md',
    'next.config.js',
    'apphosting.yaml',
]);

const detectors = [
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g },
    { name: 'Google API Key', regex: /AIza[0-9A-Za-z\-_]{35}/g },
    { name: 'GitHub Token', regex: /ghp_[0-9A-Za-z]{36}/g },
    { name: 'Slack Token', regex: /xox[baprs]-[0-9A-Za-z-]{10,}/g },
    { name: 'Stripe Live Key', regex: /sk_live_[0-9A-Za-z]{20,}/g },
    { name: 'Resend Key', regex: /re_[A-Za-z0-9_\-]{20,}/g },
    { name: 'Private Key Block', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
    {
        name: 'Hardcoded Secret Assignment',
        regex: /(?:api[_-]?key|secret|token|password|client[_-]?secret)\s*[:=]\s*['"][^'"\n]{12,}['"]/gi,
    },
];

const findings = [];

function isLikelySourceFile(relativePath) {
    const base = path.basename(relativePath);
    if (includeRootFiles.has(base)) return true;
    const ext = path.extname(relativePath);
    return allowedExtensions.has(ext);
}

async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const abs = path.join(dir, entry.name);
        const rel = path.relative(rootDir, abs).replace(/\\/g, '/');

        if (entry.isDirectory()) {
            if (ignoredDirs.has(entry.name)) continue;
            await walk(abs);
            continue;
        }

        if (ignoredFiles.has(entry.name)) continue;
        if (!isLikelySourceFile(rel)) continue;

        const content = await fs.readFile(abs, 'utf8');
        const lines = content.split('\n');

        for (const detector of detectors) {
            for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
                const line = lines[lineIndex];
                if (!detector.regex.test(line)) continue;

                findings.push({
                    file: rel,
                    line: lineIndex + 1,
                    detector: detector.name,
                    snippet: line.trim().slice(0, 180),
                });
            }
        }
    }
}

await walk(rootDir);

if (findings.length > 0) {
    console.error('Potential secrets detected:\n');
    for (const finding of findings) {
        console.error(`- ${finding.file}:${finding.line} [${finding.detector}]`);
        console.error(`  ${finding.snippet}`);
    }
    console.error('\nFailing scan. Remove/rotate secrets or move them to ignored env files.');
    process.exit(1);
}

console.log('No potential hardcoded secrets found in scanned source/config files.');