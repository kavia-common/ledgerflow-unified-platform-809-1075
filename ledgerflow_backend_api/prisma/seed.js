'use strict';

/**
 * Seed script to populate initial test data for LedgerFlow.
 *
 * Usage:
 *  - Ensure DATABASE_URL is set in your environment (e.g. via .env)
 *  - Run: npm run db:seed
 *
 * Data created:
 *  - Two users (owner and developer)
 *  - One workspace owned by owner
 *  - One project in the workspace
 *  - Three environments (Development, Staging, Production)
 *  - Memberships and example permission
 */

const { PrismaClient, Role, EnvironmentType, CiStatus } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function upsertUser(email, name) {
  // Simple deterministic hash for demo only (do NOT use in production)
  const passwordHash = crypto.createHash('sha256').update('password123').digest('hex');

  return prisma.user.upsert({
    where: { email },
    update: { name },
    create: {
      email,
      name,
      passwordHash,
      imageUrl: null,
    },
  });
}

async function main() {
  console.log('Seeding data...');

  // Create users
  const owner = await upsertUser('owner@example.com', 'Owner User');
  const dev = await upsertUser('dev@example.com', 'Developer User');

  // Create or get workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'acme' },
    update: {
      name: 'Acme Workspace',
      description: 'Primary workspace for Acme',
      ownerId: owner.id,
    },
    create: {
      slug: 'acme',
      name: 'Acme Workspace',
      description: 'Primary workspace for Acme',
      ownerId: owner.id,
    },
  });

  // Ensure memberships
  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: owner.id, workspaceId: workspace.id } },
    update: { role: Role.OWNER },
    create: {
      userId: owner.id,
      workspaceId: workspace.id,
      role: Role.OWNER,
    },
  });

  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: dev.id, workspaceId: workspace.id } },
    update: { role: Role.DEVELOPER },
    create: {
      userId: dev.id,
      workspaceId: workspace.id,
      role: Role.DEVELOPER,
    },
  });

  // Create or get project
  const project = await prisma.project.upsert({
    where: {
      workspaceId_slug: { workspaceId: workspace.id, slug: 'demo-project' },
    },
    update: {
      name: 'Demo Project',
      description: 'A sample project for demonstration.',
      defaultBranch: 'main',
    },
    create: {
      workspaceId: workspace.id,
      slug: 'demo-project',
      name: 'Demo Project',
      description: 'A sample project for demonstration.',
      defaultBranch: 'main',
    },
  });

  // Create environments
  const envNames = [
    { name: 'Development', type: EnvironmentType.DEVELOPMENT },
    { name: 'Staging', type: EnvironmentType.STAGING },
    { name: 'Production', type: EnvironmentType.PRODUCTION },
  ];

  const environments = [];
  for (const e of envNames) {
    const env = await prisma.environment.upsert({
      where: { projectId_name: { projectId: project.id, name: e.name } },
      update: { type: e.type },
      create: {
        projectId: project.id,
        name: e.name,
        type: e.type,
        url: null,
        status: 'healthy',
        configJson: { note: `Default ${e.name} environment` },
      },
    });
    environments.push(env);
  }

  // Permissions example: dev can read/write project
  await prisma.permission.upsert({
    where: { userId_projectId: { userId: dev.id, projectId: project.id } },
    update: { canRead: true, canWrite: true, canExecute: false, canAdmin: false },
    create: {
      userId: dev.id,
      projectId: project.id,
      canRead: true,
      canWrite: true,
      canExecute: false,
      canAdmin: false,
    },
  });

  // Add a sample CI run
  await prisma.ciRun.create({
    data: {
      projectId: project.id,
      environmentId: environments[0]?.id,
      status: CiStatus.PASSED,
      commitSha: '0000000000000000000000000000000000000000',
      branch: 'main',
      logsUrl: 'https://example.com/logs/ci/demo',
      triggeredById: owner.id,
      finishedAt: new Date(),
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
