import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Clear existing data (in correct order due to foreign keys)
  await prisma.message.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Seed Categories
  const catHardware = await prisma.category.create({ data: { name: 'Hardware', description: 'Physical devices, printers, monitors' } });
  const catSoftware = await prisma.category.create({ data: { name: 'Software', description: 'Application installations, licenses, bugs' } });
  const catNetwork = await prisma.category.create({ data: { name: 'Network', description: 'WiFi, Ethernet, VPN issues' } });
  const catAccount = await prisma.category.create({ data: { name: 'Account', description: 'Login, SSO, Email access' } });

  // 3. Seed Users (1 of each role)
  // Note: Password usually should be hashed with bcrypt. Mocking for now.
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@uni.edu',
      name: 'Sarah Smith',
      password: 'password123',
      role: 'STUDENT',
      department: 'Computer Science',
    }
  });

  const techUser = await prisma.user.create({
    data: {
      email: 'tech@uni.edu',
      name: 'Tom Technician',
      password: 'password123',
      role: 'TECHNICIAN',
      department: 'IT Support',
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@uni.edu',
      name: 'Alice Admin',
      password: 'password123',
      role: 'ADMIN',
      department: 'IT Management',
    }
  });

  // 4. Seed Tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'WiFi not working in Lab 2',
      description: 'None of the computers can connect to the internet.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      location: 'Lab 2',
      device: 'Lab PCs',
      authorId: studentUser.id,
      assignedToId: techUser.id,
      categoryId: catNetwork.id,
    }
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Need Photoshop installed',
      description: 'Please install Adobe Photoshop on my office PC for the design course.',
      status: 'OPEN',
      priority: 'LOW',
      location: 'Office 402',
      device: 'Dell Desktop',
      authorId: studentUser.id,
      categoryId: catSoftware.id,
    }
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Cannot login to portal',
      description: 'Getting invalid credentials error even after resetting password.',
      status: 'RESOLVED',
      priority: 'HIGH',
      location: 'Remote',
      authorId: studentUser.id,
      assignedToId: techUser.id,
      categoryId: catAccount.id,
    }
  });

  // 5. Seed Messages
  await prisma.message.create({
    data: {
      text: 'Looking into this now.',
      ticketId: ticket1.id,
      senderId: techUser.id,
    }
  });

  console.log('Seeding Complete! 🎉');
  console.log(`Created 3 Users, 4 Categories, 3 Tickets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
