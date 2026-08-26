import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to normalize Arabic text during seed
function normalizeArabicText(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel / harakat
    .replace(/\u0640/g, '') // Remove tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 1. Create Default Admin User
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@moderator.local';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AdminSecurePassword123!';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: adminEmail,
      name: 'مشرف النظام الرئيسي',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Default Admin ready: ${admin.email}`);

  // 2. Create Sample Test Group & Settings
  const sampleGroupJid = '120363012345678901@g.us';
  const sampleGroup = await prisma.group.upsert({
    where: { groupJid: sampleGroupJid },
    update: {},
    create: {
      groupJid: sampleGroupJid,
      name: 'مجموعة المطورين والتقنية (تجريبية)',
      participantCount: 48,
      isActive: true,
      settings: {
        create: {
          moderationEnabled: true,
          deleteMessages: true,
          warnUsers: true,
          notifyAdmin: true,
          maxViolations: 3,
          autoAction: 'WARN',
          allowLinks: false,
          allowedDomains: 'youtube.com,facebook.com,instagram.com,twitter.com,x.com,github.com',
          allowAds: false,
          allowMentions: true,
          aiModeration: false,
        },
      },
    },
    include: { settings: true },
  });

  console.log(`✅ Sample Group ready: ${sampleGroup.name}`);

  // 3. Create Sample Clean Forbidden Words (Safe test representations)
  const sampleWords = [
    { word: 'سبام_تجريبي', category: 'SPAM', severity: 'LOW' },
    { word: 'عرض_وهمي', category: 'ADVERTISEMENT', severity: 'MEDIUM' },
    { word: 'احتيال_مالي', category: 'SPAM', severity: 'CRITICAL' },
    { word: 'إعلان_مخالف', category: 'ADVERTISEMENT', severity: 'MEDIUM' },
    { word: 'شتم_تجريبي', category: 'INSULT', severity: 'HIGH' },
    { word: 'إساءة_لفظية', category: 'HARASSMENT', severity: 'HIGH' },
    { word: 'اربح_مليون_دولار', category: 'SPAM', severity: 'HIGH' },
    { word: 'تواصل_واتساب_للشراء', category: 'ADVERTISEMENT', severity: 'MEDIUM' },
    { word: 'فحش_تجريبي', category: 'PROFANITY', severity: 'HIGH' },
    { word: 'fake_crypto_scam', category: 'SPAM', severity: 'CRITICAL' },
    { word: 'free_followers_now', category: 'SPAM', severity: 'MEDIUM' },
  ];

  for (const item of sampleWords) {
    const norm = normalizeArabicText(item.word);
    await prisma.forbiddenWord.upsert({
      where: { word: item.word },
      update: {
        normalizedWord: norm,
        category: item.category,
        severity: item.severity,
      },
      create: {
        word: item.word,
        normalizedWord: norm,
        category: item.category,
        severity: item.severity,
        enabled: true,
      },
    });
  }

  console.log(`✅ ${sampleWords.length} Sample Forbidden Words seeded.`);

  // 4. Create Sample Word Exceptions
  const exceptions = [
    { word: 'إعلان رسمي من الإدارة', reason: 'بيانات الإدارة الرسمية مصرح بها' },
    { word: 'رابط الزوم الرسمي', reason: 'روابط الاجتماعات الرسمية مصرح بها' },
  ];

  for (const exc of exceptions) {
    const norm = normalizeArabicText(exc.word);
    await prisma.wordException.upsert({
      where: { word: exc.word },
      update: {
        normalizedWord: norm,
        reason: exc.reason,
      },
      create: {
        word: exc.word,
        normalizedWord: norm,
        reason: exc.reason,
      },
    });
  }

  console.log(`✅ ${exceptions.length} Word Exceptions seeded.`);

  // 5. Create Sample Member
  const sampleMember = await prisma.member.upsert({
    where: { userJid: '966500000001@s.whatsapp.net' },
    update: {},
    create: {
      userJid: '966500000001@s.whatsapp.net',
      phoneNumber: '+966500000001',
      name: 'أحمد التجريبي',
      totalViolations: 0,
      isBlocked: false,
    },
  });

  console.log(`✅ Sample Member ready: ${sampleMember.name}`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
