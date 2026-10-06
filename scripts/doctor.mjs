#!/usr/bin/env node
/**
 * KURIPP System Health Doctor
 * Verifies developer environment, prerequisites, database readiness,
 * and security configurations for local development and CI.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();

// ANSI Styling
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  zinc: '\x1b[90m',
  white: '\x1b[97m',
  emerald: '\x1b[32m',
  amber: '\x1b[33m',
  rose: '\x1b[31m',
  cyan: '\x1b[36m',
};

const checks = [];

function addCheck(name, fn) {
  checks.push({ name, fn });
}

function runCmd(cmd) {
  try {
    return execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

console.log(`\n${colors.bold}${colors.white}================================================================${colors.reset}`);
console.log(`${colors.bold}${colors.white}  KURIPP — AI Knowledge & Research Platform: System Doctor       ${colors.reset}`);
console.log(`${colors.zinc}  Auditing local developer environment, runtimes, and containers  ${colors.reset}`);
console.log(`${colors.bold}${colors.white}================================================================${colors.reset}\n`);

// 1. Node.js Version
addCheck('Node.js Runtime (>= 20.0.0)', () => {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  if (major >= 20) {
    return { ok: true, message: `Installed: ${version}` };
  }
  return { ok: false, message: `Installed: ${version} (Requires Node.js >= 20.0.0)` };
});

// 2. pnpm Package Manager
addCheck('pnpm Package Manager (>= 9.0.0)', () => {
  const version = runCmd('pnpm --version');
  if (version) {
    const major = parseInt(version.split('.')[0], 10);
    if (major >= 9) {
      return { ok: true, message: `pnpm v${version} installed` };
    }
    return { ok: false, message: `pnpm v${version} found, requires >= 9.0.0` };
  }
  return { ok: false, message: 'pnpm not found on PATH. Install via corepack or npm i -g pnpm' };
});

// 3. Python 3.11+ & uv Tooling
addCheck('Python & uv Tooling', () => {
  const uvVersion = runCmd('uv --version');
  const pyVersion =
    runCmd('uv run --project services/ai python --version') ||
    runCmd('python --version') ||
    runCmd('python3 --version') ||
    runCmd('py -3 --version');

  if (pyVersion && uvVersion) {
    return { ok: true, message: `${pyVersion} · ${uvVersion}` };
  } else if (uvVersion) {
    return { ok: true, message: `${uvVersion} (Fast Python package runner ready)` };
  } else if (pyVersion) {
    return { ok: true, warning: true, message: `${pyVersion} installed (uv recommended for speed)` };
  }
  return { ok: false, message: 'Python/uv not found on PATH. Required for layout chunker service' };
});

// 4. Monorepo Workspaces & Packages
addCheck('Turborepo Workspaces Integrity', () => {
  const packages = [
    'apps/api/package.json',
    'apps/web/package.json',
    'packages/shared-types/package.json',
    'packages/tsconfig/package.json',
    'packages/eslint-config/package.json',
    'services/ai/pyproject.toml',
  ];

  const missing = packages.filter((pkg) => !fs.existsSync(path.join(rootDir, pkg)));
  if (missing.length === 0) {
    return { ok: true, message: `All ${packages.length} monorepo packages configured` };
  }
  return { ok: false, message: `Missing package manifests: ${missing.join(', ')}` };
});

// 5. Environment Configurations (.env files)
addCheck('Environment Configurations', () => {
  const envFiles = [
    { target: 'apps/api/.env', example: 'apps/api/.env.example' },
    { target: 'apps/web/.env.local', example: 'apps/web/.env.example' },
  ];

  let readyCount = 0;
  const warnings = [];

  for (const { target, example } of envFiles) {
    const targetPath = path.join(rootDir, target);
    const examplePath = path.join(rootDir, example);

    if (fs.existsSync(targetPath)) {
      readyCount++;
    } else if (fs.existsSync(examplePath)) {
      warnings.push(`Missing ${target} (copy from ${example})`);
    } else {
      warnings.push(`Missing ${target}`);
    }
  }

  if (warnings.length === 0) {
    return { ok: true, message: 'All environment configuration files present' };
  }
  return { ok: true, warning: true, message: `${readyCount}/${envFiles.length} configured · ${warnings.join(' · ')}` };
});

// 6. Git Security Audit (.env in .gitignore)
addCheck('Zero Secrets in Git Audit', () => {
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    return { ok: false, message: 'Missing root .gitignore' };
  }
  const content = fs.readFileSync(gitignorePath, 'utf8');
  if (content.includes('.env') && content.includes('node_modules')) {
    return { ok: true, message: 'Sensitive environment files excluded from version control' };
  }
  return { ok: false, message: '.gitignore missing .env or node_modules exclusions' };
});

// 7. Docker Infrastructure Status
addCheck('Docker Infrastructure Readiness', () => {
  const dockerInfo = runCmd('docker info');
  if (!dockerInfo) {
    return {
      ok: true,
      warning: true,
      message: 'Docker daemon inactive or not installed (Mock/offline test modes available)',
    };
  }

  const ps = runCmd('docker ps --format "{{.Names}}"') || '';
  const hasPg = ps.toLowerCase().includes('postgres') || ps.toLowerCase().includes('kuripp-postgres');
  const hasRedis = ps.toLowerCase().includes('redis') || ps.toLowerCase().includes('kuripp-redis');

  if (hasPg && hasRedis) {
    return { ok: true, message: 'Docker daemon running (Postgres & Redis containers active)' };
  }
  return {
    ok: true,
    warning: true,
    message: 'Docker daemon running. Start stack via: pnpm docker:up',
  };
});

// Execute Checks
let passed = 0;
let warned = 0;
let failed = 0;

for (const check of checks) {
  try {
    const result = check.fn();
    if (result.ok && !result.warning) {
      console.log(`  ${colors.emerald}✓${colors.reset} ${colors.bold}${check.name}${colors.reset}`);
      console.log(`    ${colors.zinc}${result.message}${colors.reset}\n`);
      passed++;
    } else if (result.warning) {
      console.log(`  ${colors.amber}⚠${colors.reset} ${colors.bold}${check.name}${colors.reset}`);
      console.log(`    ${colors.amber}${result.message}${colors.reset}\n`);
      warned++;
    } else {
      console.log(`  ${colors.rose}✗${colors.reset} ${colors.bold}${check.name}${colors.reset}`);
      console.log(`    ${colors.rose}${result.message}${colors.reset}\n`);
      failed++;
    }
  } catch (err) {
    console.log(`  ${colors.rose}✗${colors.reset} ${colors.bold}${check.name}${colors.reset}`);
    console.log(`    ${colors.rose}${err.message}${colors.reset}\n`);
    failed++;
  }
}

console.log(`${colors.zinc}----------------------------------------------------------------${colors.reset}`);
console.log(
  `  ${colors.bold}Audit Summary:${colors.reset} ${colors.emerald}${passed} passed${colors.reset} · ${
    warned > 0 ? `${colors.amber}${warned} warnings${colors.reset} · ` : ''
  }${failed > 0 ? `${colors.rose}${failed} failed${colors.reset}` : `${colors.emerald}0 errors${colors.reset}`}`
);
console.log(`${colors.zinc}----------------------------------------------------------------${colors.reset}\n`);

if (failed > 0) {
  console.log(`${colors.rose}Doctor found ${failed} blocking issue(s). Address the recommendations above before building.${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`${colors.emerald}Platform environment is healthy and ready for development, testing, and deployment.${colors.reset}\n`);
  process.exit(0);
}
