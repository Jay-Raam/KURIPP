import { prisma } from '../lib/prisma';
import { hashPassword } from '../auth/password';
import { logger } from '../lib/logger';

async function seed() {
  logger.info('Starting KURIPP Enterprise Database Seeder...');

  // 1. Create Recruiter / Demo User
  const demoEmail = 'recruiter@kuripp.demo';
  const passwordHash = await hashPassword('KurippDemo2026!');

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      fullName: 'Senior Staff AI Evaluator',
      passwordHash,
      emailVerified: true,
    },
  });
  logger.info(`Seeded demo user: ${user.email} (${user.id})`);

  // 2. Create Organization & Workspace
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-intelligence' },
    update: {},
    create: {
      name: 'Acme Intelligence Corp',
      slug: 'acme-intelligence',
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'core-legal-research' },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Core Legal & Security Research',
      slug: 'core-legal-research',
      description: 'Master agreements, SOC 2 audits, DPAs, and cloud architecture specifications',
    },
  });

  // Assign Owner Role
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: 'OWNER',
    },
  });

  // 3. Create Sample Documents & Chunks
  const sampleDocs = [
    {
      title: 'Master Services Agreement (MSA 2024)',
      mimeType: 'application/pdf',
      chunks: [
        {
          sectionHeading: 'Section 4: Payment Terms & Invoicing',
          pageNumber: 3,
          content: 'Payment Terms: Customer shall pay all undisputed invoices within Net 30 days of the invoice date. Late payments shall accrue interest at 1.5% per month or the legal maximum.',
        },
        {
          sectionHeading: 'Section 9: Limitation of Liability',
          pageNumber: 8,
          content: 'Limitation of Liability: In no event shall either party total aggregate liability under this Agreement exceed the total fees paid or payable by Customer in the twelve (12) months preceding the incident.',
        },
      ],
    },
    {
      title: 'Master Services Agreement Revision (MSA 2026)',
      mimeType: 'application/pdf',
      chunks: [
        {
          sectionHeading: 'Section 4: Commercial Terms & Net 60 Invoicing',
          pageNumber: 4,
          content: 'Payment Terms: Customer shall remit payments within Net 60 days of invoice receipt via electronic fund transfer. Invoices subject to automated verification.',
        },
        {
          sectionHeading: 'Section 9: Expanded Aggregate Liability Ceiling',
          pageNumber: 9,
          content: 'Limitation of Liability: Total aggregate liability for data protection or confidentiality breaches shall be capped at twenty-four (24) months of fees paid.',
        },
      ],
    },
    {
      title: 'Data Processing Addendum & SOC 2 Certification (DPA)',
      mimeType: 'application/pdf',
      chunks: [
        {
          sectionHeading: 'Security Controls & Encryption Standards',
          pageNumber: 2,
          content: 'Data Security: Vendor certifies SOC 2 Type II compliance annually. All customer data must be encrypted using AES-256 at rest and TLS 1.3 in transit.',
        },
        {
          sectionHeading: 'Incident Response & Breach Notification Timeline',
          pageNumber: 5,
          content: 'Breach Notification: In the event of a confirmed security incident affecting customer data, Vendor shall notify Customer within twenty-four (24) hours of confirmation.',
        },
      ],
    },
  ];

  for (const doc of sampleDocs) {
    const createdDoc = await prisma.document.create({
      data: {
        workspaceId: workspace.id,
        title: doc.title,
        mimeType: doc.mimeType,
        fileSize: BigInt(204800),
        r2ObjectKey: `demo/${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`,
        status: 'READY',
        pageCount: 12,
      },
    });

    for (let idx = 0; idx < doc.chunks.length; idx++) {
      const chunk = doc.chunks[idx]!;
      await prisma.documentChunk.create({
        data: {
          documentId: createdDoc.id,
          workspaceId: workspace.id,
          sectionHeading: chunk.sectionHeading,
          pageNumber: chunk.pageNumber,
          chunkIndex: idx,
          content: chunk.content,
          tokenCount: 65,
        },
      });
    }
  }

  // 4. Create Sample Collection & Notes
  const collection = await prisma.collection.create({
    data: {
      workspaceId: workspace.id,
      name: 'Vendor Governance & Compliance 2026',
      description: 'Grouped contractual artifacts and compliance certifications',
      color: 'zinc',
    },
  });

  await prisma.researchNote.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      collectionId: collection.id,
      title: 'Executive Assessment: Payment Terms Shift & SOC 2 Mandate',
      content: `# Executive Summary
Comparison of 2024 and 2026 agreements indicates a strategic shift from Net 30 to Net 60 payment terms.
Mandatory SOC 2 Type II controls and 24-hour breach notification timelines are now formalized.`,
      tags: ['compliance', 'vendor-risk', 'soc2'],
    },
  });

  logger.info('KURIPP Enterprise Database Seeding Complete.');
  logger.info(`Credentials: email="${demoEmail}", password="KurippDemo2026!"`);
}

seed()
  .catch((err) => {
    logger.error('Seeder encountered error:', { err });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
