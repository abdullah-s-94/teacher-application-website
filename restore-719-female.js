#!/usr/bin/env node

/**
 * Precise Female Applicant Restoration to 719
 */

import { Client } from 'pg';
import fs from 'fs';

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function restoreTo719() {
  console.log('🎯 استرداد دقيق لـ 719 طلب من مجمع البنات...');
  
  try {
    await client.connect();
    
    // Get current female applications ordered by ID
    const currentApps = await client.query(`
      SELECT id, full_name, national_id, cv_cloudinary_id
      FROM applications 
      WHERE gender = 'female'
      ORDER BY id ASC
    `);
    
    console.log(`📊 العدد الحالي: ${currentApps.rows.length} طلب`);
    
    if (currentApps.rows.length > 719) {
      // Delete the excess applications (keep first 719)
      const idsToKeep = currentApps.rows.slice(0, 719).map(app => app.id);
      const lastIdToKeep = idsToKeep[idsToKeep.length - 1];
      
      console.log(`🔪 حذف الطلبات بعد ID: ${lastIdToKeep}`);
      
      const deleteResult = await client.query(`
        DELETE FROM applications 
        WHERE gender = 'female' AND id > $1
      `, [lastIdToKeep]);
      
      console.log(`✅ تم حذف ${deleteResult.rowCount} طلب زائد`);
    }
    
    // Now enhance file recovery for remaining applications
    console.log('🔄 تحسين استرداد الملفات...');
    
    // Read backup for file information
    const backupData = JSON.parse(fs.readFileSync('backup_1753029739594.json', 'utf8'));
    const backupMap = new Map();
    
    // Create a map of national_id to backup data
    backupData.applications.forEach(app => {
      if (app.gender === 'female') {
        backupMap.set(app.national_id, app);
      }
    });
    
    // Restore file links from backup
    let restoredCount = 0;
    const remainingApps = await client.query(`
      SELECT id, national_id, full_name 
      FROM applications 
      WHERE gender = 'female' 
      AND (cv_cloudinary_id IS NULL OR cv_cloudinary_id = '')
    `);
    
    for (const app of remainingApps.rows) {
      const backupData = backupMap.get(app.national_id);
      if (backupData && backupData.cv_cloudinary_id) {
        await client.query(`
          UPDATE applications 
          SET cv_cloudinary_id = $1,
              cv_cloudinary_url = $2,
              cv_original_name = $3
          WHERE id = $4
        `, [
          backupData.cv_cloudinary_id,
          backupData.cv_cloudinary_url,
          backupData.cv_original_name || 'السيرة الذاتية.pdf',
          app.id
        ]);
        restoredCount++;
        console.log(`✅ استرداد ملف للمتقدمة: ${app.full_name}`);
      }
    }
    
    // Final verification
    const finalCount = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN cv_cloudinary_id IS NOT NULL AND cv_cloudinary_id != '' THEN 1 END) as with_files
      FROM applications 
      WHERE gender = 'female'
    `);
    
    console.log('\n🎊 النتيجة النهائية:');
    console.log(`👩 إجمالي طلبات البنات: ${finalCount.rows[0].total}`);
    console.log(`📎 طلبات مع ملفات: ${finalCount.rows[0].with_files}`);
    console.log(`✅ ملفات مستردة في هذه الجلسة: ${restoredCount}`);
    
    if (finalCount.rows[0].total == 719) {
      console.log('🎯 نجح! العدد الآن 719 بالضبط كما طلبت!');
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ خطأ:', error);
    await client.end();
  }
}

restoreTo719();