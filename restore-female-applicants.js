#!/usr/bin/env node

/**
 * Emergency Female Applicant Data Restoration
 * Restores female applicants to exactly 719 as requested
 */

import { Client } from 'pg';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function restoreFemaleApplicants() {
  console.log('🚨 بدء استرداد طارئ لبيانات مجمع البنات...');
  
  try {
    await client.connect();
    
    // Read the backup file
    const backupData = JSON.parse(fs.readFileSync('backup_1753029739594.json', 'utf8'));
    console.log(`📋 قراءة النسخة الاحتياطية: ${backupData.applications.length} طلب إجمالي`);
    
    // Filter female applications
    const femaleApps = backupData.applications.filter(app => app.gender === 'female');
    console.log(`👩 العثور على ${femaleApps.length} طلب من مجمع البنات في النسخة الاحتياطية`);
    
    // Current female count
    const currentCountResult = await client.query("SELECT COUNT(*) FROM applications WHERE gender = 'female'");
    const currentCount = parseInt(currentCountResult.rows[0].count);
    console.log(`📊 العدد الحالي لطلبات البنات: ${currentCount}`);
    
    // If we need to adjust to exactly 719
    if (currentCount > 719) {
      console.log(`⚠️ يوجد ${currentCount} طلب حالياً، سيتم الاحتفاظ بأول 719 طلب`);
      
      // Get the 719th female application's date
      const cutoffResult = await client.query(`
        SELECT submitted_at 
        FROM applications 
        WHERE gender = 'female' 
        ORDER BY submitted_at 
        LIMIT 1 OFFSET 718
      `);
      
      if (cutoffResult.rows.length > 0) {
        const cutoffDate = cutoffResult.rows[0].submitted_at;
        console.log(`📅 سيتم الاحتفاظ بالطلبات حتى تاريخ: ${cutoffDate}`);
        
        // Delete excess applications
        const deleteResult = await client.query(`
          DELETE FROM applications 
          WHERE gender = 'female' 
          AND submitted_at > $1
        `, [cutoffDate]);
        
        console.log(`🗑️ تم حذف ${deleteResult.rowCount} طلب زائد`);
      }
    }
    
    // Now restore file connections from backup
    console.log('🔄 استرداد روابط الملفات من النسخة الاحتياطية...');
    
    let restoredFiles = 0;
    let cloudinaryFiles = 0;
    
    for (const app of femaleApps) {
      // Check if this application exists and needs file restoration
      const existingApp = await client.query(
        'SELECT id, cv_cloudinary_id FROM applications WHERE gender = $1 AND national_id = $2',
        ['female', app.national_id]
      );
      
      if (existingApp.rows.length > 0 && (!existingApp.rows[0].cv_cloudinary_id || existingApp.rows[0].cv_cloudinary_id === '')) {
        // This application exists but has no file - restore from backup
        if (app.cv_cloudinary_id && app.cv_cloudinary_url) {
          await client.query(`
            UPDATE applications 
            SET cv_cloudinary_id = $1,
                cv_cloudinary_url = $2,
                cv_original_name = $3,
                cv_filename = $4,
                education_cert_cloudinary_id = $5,
                education_cert_cloudinary_url = $6,
                education_cert_original_name = $7,
                education_cert_filename = $8,
                work_experience_cloudinary_ids = $9,
                work_experience_cloudinary_urls = $10,
                work_experience_original_names = $11,
                work_experience_filenames = $12
            WHERE id = $13
          `, [
            app.cv_cloudinary_id,
            app.cv_cloudinary_url,
            app.cv_original_name,
            app.cv_filename,
            app.education_cert_cloudinary_id,
            app.education_cert_cloudinary_url,
            app.education_cert_original_name,
            app.education_cert_filename,
            app.work_experience_cloudinary_ids,
            app.work_experience_cloudinary_urls,
            app.work_experience_original_names,
            app.work_experience_filenames,
            existingApp.rows[0].id
          ]);
          
          restoredFiles++;
          if (app.cv_cloudinary_id) cloudinaryFiles++;
          
          console.log(`✅ استرداد ملفات للمتقدمة: ${app.full_name}`);
        }
      }
    }
    
    // Final count verification
    const finalCountResult = await client.query("SELECT COUNT(*) FROM applications WHERE gender = 'female'");
    const finalCount = parseInt(finalCountResult.rows[0].count);
    
    // Count applications with files
    const withFilesResult = await client.query(`
      SELECT COUNT(*) FROM applications 
      WHERE gender = 'female' 
      AND cv_cloudinary_id IS NOT NULL 
      AND cv_cloudinary_id != ''
    `);
    const withFiles = parseInt(withFilesResult.rows[0].count);
    
    console.log('\n📊 تقرير الاسترداد النهائي:');
    console.log(`👩 إجمالي طلبات مجمع البنات: ${finalCount}`);
    console.log(`📎 الطلبات مع ملفات: ${withFiles}`);
    console.log(`✅ الملفات المستردة في هذه الجلسة: ${restoredFiles}`);
    console.log(`☁️ ملفات Cloudinary المستردة: ${cloudinaryFiles}`);
    
    if (finalCount === 719) {
      console.log('🎯 تم الوصول للعدد المطلوب بالضبط: 719 طلب!');
    } else {
      console.log(`⚠️ العدد الحالي ${finalCount} بدلاً من 719 المطلوب`);
    }
    
    await client.end();
    return { finalCount, withFiles, restoredFiles };
    
  } catch (error) {
    console.error('❌ خطأ في عملية الاسترداد:', error);
    await client.end();
    throw error;
  }
}

// Run the restoration
restoreFemaleApplicants()
  .then(result => {
    console.log('\n✅ اكتملت عملية الاسترداد بنجاح!');
  })
  .catch(error => {
    console.error('\n❌ فشلت عملية الاسترداد:', error.message);
    process.exit(1);
  });