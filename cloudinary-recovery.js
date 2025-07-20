#!/usr/bin/env node

/**
 * Advanced Cloudinary File Recovery Script
 * Attempts to match existing Cloudinary files to database applications
 */

import { Client } from 'pg';
import { v2 as cloudinary } from 'cloudinary';

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function recoverFromCloudinary() {
  await client.connect();
  console.log('🔍 استرداد متقدم من Cloudinary...');
  
  // Get all Cloudinary resources
  let allCloudinaryFiles = [];
  let nextCursor = null;
  
  do {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'raw',
      max_results: 500,
      next_cursor: nextCursor
    });
    
    allCloudinaryFiles = allCloudinaryFiles.concat(result.resources);
    nextCursor = result.next_cursor;
    console.log(`📁 جُلب ${allCloudinaryFiles.length} ملف من Cloudinary...`);
  } while (nextCursor);
  
  console.log(`☁️ إجمالي ملفات Cloudinary: ${allCloudinaryFiles.length}`);
  
  // Get applications without files
  const missingApps = await client.query(`
    SELECT id, full_name, national_id, gender, submitted_at
    FROM applications 
    WHERE cv_cloudinary_id IS NULL OR cv_cloudinary_id = ''
    ORDER BY submitted_at DESC
  `);
  
  console.log(`🔍 العثور على ${missingApps.rows.length} طلب بحاجة للاسترداد`);
  
  let recoveredCount = 0;
  const recoveredFiles = [];
  
  for (const app of missingApps.rows) {
    // Try multiple matching strategies
    const nameVariations = [
      app.full_name,
      app.full_name.replace(/\s+/g, '_'),
      app.full_name.split(' ')[0], // First name
      app.national_id
    ];
    
    let bestMatch = null;
    
    for (const file of allCloudinaryFiles) {
      const fileName = file.original_filename || file.public_id;
      
      // Check if any name variation matches
      for (const variation of nameVariations) {
        if (fileName.includes(variation) || file.public_id.includes(variation)) {
          bestMatch = file;
          break;
        }
      }
      
      if (bestMatch) break;
    }
    
    if (bestMatch) {
      try {
        await client.query(`
          UPDATE applications 
          SET cv_cloudinary_id = $1, 
              cv_cloudinary_url = $2, 
              cv_original_name = $3
          WHERE id = $4
        `, [
          bestMatch.public_id, 
          bestMatch.secure_url, 
          bestMatch.original_filename || `${app.full_name}_السيرة الذاتية.pdf`,
          app.id
        ]);
        
        recoveredFiles.push({
          applicant: app.full_name,
          file: bestMatch.original_filename || bestMatch.public_id
        });
        
        recoveredCount++;
        console.log(`✅ تم ربط الملف للمتقدم: ${app.full_name}`);
      } catch (error) {
        console.error(`❌ فشل في ربط الملف للمتقدم ${app.full_name}:`, error.message);
      }
    }
  }
  
  await client.end();
  
  console.log(`🎉 تم استرداد ${recoveredCount} ملف إضافي من Cloudinary`);
  return { recoveredCount, recoveredFiles };
}

// Run recovery
recoverFromCloudinary()
  .then(result => {
    console.log('✅ اكتملت عملية الاسترداد من Cloudinary');
    console.log(`📊 الملفات المستردة: ${result.recoveredCount}`);
  })
  .catch(error => {
    console.error('❌ خطأ في الاسترداد:', error);
  });