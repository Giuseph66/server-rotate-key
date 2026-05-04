import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create global settings
  await prisma.settings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      cooldownMinutes: 5,
      maxRetries: 3,
      rotationStrategy: 'round-robin',
      ollamaBaseUrl: 'https://ollama.com',
    },
  });
  console.log('  ✅ Settings created');

  // Create admin tenant
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.tenant.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      email: 'admin@ollama-pool.local',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    },
  });
  console.log(`  ✅ Admin tenant created (user: admin, pass: admin123)`);

  // Create a demo tenant
  const demoPassword = await bcrypt.hash('demo123', 10);
  const demo = await prisma.tenant.upsert({
    where: { name: 'demo' },
    update: {},
    create: {
      name: 'demo',
      email: 'demo@ollama-pool.local',
      password: demoPassword,
      role: 'user',
      isActive: true,
    },
  });
  console.log(`  ✅ Demo tenant created (user: demo, pass: demo123)`);

  console.log('\n🎉 Seed completed!');
  console.log('   Login with: admin / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
