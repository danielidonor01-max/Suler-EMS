import { PrismaClient } from '@prisma/client';
import { ChannelService } from '../src/modules/communication/services/channel.service';
import { MessagingService } from '../src/modules/communication/services/messaging.service';
import { AnnouncementService } from '../src/modules/communication/services/announcement.service';

const prisma = new PrismaClient();

async function getUserId(email: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  return user.id;
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Suler EMS — E2E Messaging & Announcement Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Resolve users
  const bolaId = await getUserId('bola@suler.com');
  const kemiId = await getUserId('employee@suler.com');
  const hrId = await getUserId('hr@suler.com');

  console.log('1. User IDs resolved:');
  console.log(`   - Bola: ${bolaId}`);
  console.log(`   - Kemi (Employee): ${kemiId}`);
  console.log(`   - HR: ${hrId}`);
  console.log('');

  // 2. DM flow: bola@suler.com sends DM to employee@suler.com (Kemi)
  console.log('2. DM flow: Bola sends a message to Kemi...');
  const dmConv = await ChannelService.getOrCreateDM(bolaId, kemiId);
  console.log(`   ✓ DM Conversation verified/created with ID: ${dmConv.id}`);
  
  const msg1 = await MessagingService.sendMessage({
    conversationId: dmConv.id,
    senderId: bolaId,
    content: 'Hi Kemi, hope your day is going well!'
  });
  console.log(`   ✓ Message sent from Bola! ID: ${msg1.id}, Content: "${msg1.content}"`);
  console.log('');

  // 3. Reply from Kemi to Bola
  console.log('3. DM flow: Kemi replies to Bola...');
  const msg2 = await MessagingService.sendMessage({
    conversationId: dmConv.id,
    senderId: kemiId,
    content: 'Hello Bola! Yes, thank you. Let me know if you need anything.'
  });
  console.log(`   ✓ Message sent from Kemi! ID: ${msg2.id}, Content: "${msg2.content}"`);
  console.log('');

  // 4. Mark messages as read
  console.log('4. Marking messages as read...');
  await MessagingService.markAsRead(dmConv.id, kemiId);
  await MessagingService.markAsRead(dmConv.id, bolaId);
  console.log('   ✓ DM conversation read states updated.');
  console.log('');

  // 5. Announcement flow: HR posts a GLOBAL announcement
  console.log('5. Announcement flow: HR publishes a GLOBAL announcement...');
  const announcement = await AnnouncementService.publish({
    title: 'Q3 Enterprise Architecture Update',
    content: 'We are completing Phase 3 migration. All systems are operating normally on Node 20 / PostgreSQL.',
    category: 'GLOBAL',
    authorId: hrId
  });
  console.log(`   ✓ Global Announcement published! ID: ${announcement.id}, Title: "${announcement.title}"`);
  console.log('');

  // 6. Database Sanity Checks
  console.log('6. Executing Database Sanity check...');
  
  const conversationsGroup = await prisma.conversation.groupBy({
    by: ['classification'],
    _count: true
  });
  
  const messagesCount = await prisma.message.count();
  
  const announcementsGroup = await prisma.announcement.groupBy({
    by: ['category'],
    _count: true
  });

  console.log('\n   [Sanity Results] Conversations by Classification:');
  console.table(conversationsGroup.map(c => ({ Classification: c.classification, Count: c._count })));

  console.log(`   [Sanity Results] Total Messages in Database: ${messagesCount}`);

  console.log('\n   [Sanity Results] Announcements by Category:');
  console.table(announcementsGroup.map(a => ({ Category: a.category, Count: a._count })));

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  E2E Messaging & Announcement Test Successful!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(e => {
    console.error('\n❌ E2E Messaging Test Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
