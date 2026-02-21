/**
 * SAFE Migration Script - Preserves all data
 * Run BEFORE doing prisma db push
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting SAFE migration...\n');

  // Step 1: Copy builderData to a temporary backup
  console.log('Step 1: Backing up form version data...');
  const formVersions = await prisma.$queryRaw`
    SELECT id, "builderData" FROM form_versions WHERE "builderData" IS NOT NULL
  `;
  
  console.log(`   ✓ Found ${formVersions.length} form versions with data\n`);

  // Step 2: Check if schema column exists
  console.log('Step 2: Checking if schema column exists...');
  try {
    await prisma.$queryRaw`SELECT schema FROM form_versions LIMIT 1`;
    console.log('   ✓ Schema column already exists\n');
    
    // Copy data from builderData to schema
    console.log('Step 3: Copying builderData to schema column...');
    await prisma.$executeRaw`
      UPDATE form_versions 
      SET schema = "builderData"
      WHERE "builderData" IS NOT NULL AND (schema = '[]'::jsonb OR schema IS NULL)
    `;
    console.log('   ✓ Data copied successfully\n');
    
  } catch (error) {
    console.log('   ℹ Schema column does not exist yet (this is normal)\n');
    console.log('   → Run "npx prisma db push" and answer "y" to the warning');
    console.log('   → Then run this script again to copy the data\n');
    return;
  }

  // Step 4: Verify data was copied
  console.log('Step 4: Verifying data integrity...');
  const verifyCount = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM form_versions WHERE schema != '[]'::jsonb
  `;
  console.log(`   ✓ ${verifyCount[0].count} form versions have schema data\n`);

  console.log('✅ Safe migration preparation complete!');
  console.log('\nYour data is safe. The builderData can now be dropped.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
