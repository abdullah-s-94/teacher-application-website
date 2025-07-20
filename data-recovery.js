#!/usr/bin/env node

/**
 * Comprehensive Data Recovery Script for Anjal Al-Nukhba Schools
 * Recovers lost Cloudinary file connections and restores application data
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Database configuration
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('🔧 بدء عملية استرداد البيانات المفقودة...');
console.log('📊 جاري تحليل حالة البيانات الحالية...');

async function analyzeCurrentState() {
  await client.connect();
  
  // Check current application status
  const totalApps = await client.query('SELECT COUNT(*) FROM applications');
  const missingFiles = await client.query(`
    SELECT COUNT(*) FROM applications 
    WHERE cv_cloudinary_id IS NULL OR cv_cloudinary_id = ''
  `);
  
  console.log(`📈 إجمالي الطلبات: ${totalApps.rows[0].count}`);
  console.log(`❌ الطلبات المفقودة الملفات: ${missingFiles.rows[0].count}`);
  
  return {
    total: parseInt(totalApps.rows[0].count),
    missing: parseInt(missingFiles.rows[0].count)
  };
}

async function scanCloudinaryFiles() {
  console.log('☁️ جاري فحص ملفات Cloudinary المتاحة...');
  
  try {
    // Get all resources from Cloudinary
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500,
      resource_type: 'raw'
    });
    
    console.log(`☁️ تم العثور على ${result.resources.length} ملف في Cloudinary`);
    return result.resources;
  } catch (error) {
    console.error('❌ خطأ في الاتصال بـ Cloudinary:', error.message);
    return [];
  }
}

async function scanLocalFiles() {
  console.log('📁 جاري فحص الملفات المحلية المتاحة...');
  
  const uploadsDir = './uploads';
  if (!fs.existsSync(uploadsDir)) {
    console.log('📁 مجلد uploads غير موجود');
    return [];
  }
  
  const files = fs.readdirSync(uploadsDir);
  console.log(`📁 تم العثور على ${files.length} ملف محلي`);
  return files;
}

async function attemptFileRecovery() {
  console.log('🔄 بدء عملية استرداد الملفات...');
  
  // Get applications missing files
  const missingAppsQuery = `
    SELECT id, full_name, national_id, phone, gender, submitted_at
    FROM applications 
    WHERE cv_cloudinary_id IS NULL OR cv_cloudinary_id = ''
    ORDER BY submitted_at DESC
  `;
  
  const missingApps = await client.query(missingAppsQuery);
  console.log(`🔍 العثور على ${missingApps.rows.length} طلب يحتاج استرداد الملفات`);
  
  // Scan available files
  const cloudinaryFiles = await scanCloudinaryFiles();
  const localFiles = await scanLocalFiles();
  
  let recoveredCount = 0;
  
  for (const app of missingApps.rows) {
    // Try to match files by timestamp, name, or national ID
    const possibleMatches = [];
    
    // Check Cloudinary files
    for (const file of cloudinaryFiles) {
      if (file.public_id.includes(app.national_id) || 
          file.original_filename?.includes(app.full_name.split(' ')[0])) {
        possibleMatches.push({
          type: 'cloudinary',
          id: file.public_id,
          url: file.secure_url,
          filename: file.original_filename
        });
      }
    }
    
    // Check local files by timestamp matching
    const submittedDate = new Date(app.submitted_at);
    const dayStart = new Date(submittedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(submittedDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    for (const file of localFiles) {
      const fileStats = fs.statSync(path.join('./uploads', file));
      const fileDate = new Date(fileStats.mtime);
      
      if (fileDate >= dayStart && fileDate <= dayEnd) {
        possibleMatches.push({
          type: 'local',
          filename: file,
          path: path.join('./uploads', file)
        });
      }
    }
    
    // If we found potential matches, use the first one
    if (possibleMatches.length > 0) {
      const match = possibleMatches[0];
      
      try {
        if (match.type === 'cloudinary') {
          // Update database with Cloudinary info
          await client.query(`
            UPDATE applications 
            SET cv_cloudinary_id = $1, cv_cloudinary_url = $2, cv_original_name = $3
            WHERE id = $4
          `, [match.id, match.url, match.filename || 'السيرة الذاتية.pdf', app.id]);
          
          console.log(`✅ تم استرداد ملف Cloudinary للمتقدم: ${app.full_name}`);
          recoveredCount++;
        } else if (match.type === 'local') {
          // Upload local file to Cloudinary and update database
          const uploadResult = await cloudinary.uploader.upload(match.path, {
            resource_type: 'raw',
            public_id: `cv_${app.id}_${Date.now()}`,
            original_filename: `${app.full_name}_السيرة الذاتية.pdf`
          });
          
          await client.query(`
            UPDATE applications 
            SET cv_cloudinary_id = $1, cv_cloudinary_url = $2, cv_original_name = $3
            WHERE id = $4
          `, [uploadResult.public_id, uploadResult.secure_url, uploadResult.original_filename, app.id]);
          
          console.log(`✅ تم رفع واسترداد ملف محلي للمتقدم: ${app.full_name}`);
          recoveredCount++;
        }
      } catch (error) {
        console.error(`❌ فشل في استرداد ملف للمتقدم ${app.full_name}:`, error.message);
      }
    }
  }
  
  console.log(`🎉 تم استرداد ${recoveredCount} ملف من أصل ${missingApps.rows.length}`);
  return recoveredCount;
}

async function createBackupFile() {
  console.log('💾 جاري إنشاء نسخة احتياطية من البيانات الحالية...');
  
  const allApps = await client.query(`
    SELECT * FROM applications ORDER BY submitted_at DESC
  `);
  
  const backup = {
    timestamp: new Date().toISOString(),
    total_applications: allApps.rows.length,
    applications: allApps.rows
  };
  
  const backupPath = `backup_${Date.now()}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`💾 تم إنشاء النسخة الاحتياطية: ${backupPath}`);
  
  return backupPath;
}

async function generateRecoveryReport() {
  console.log('📋 جاري إنشاء تقرير الاسترداد...');
  
  const finalStats = await analyzeCurrentState();
  const successRate = ((finalStats.total - finalStats.missing) / finalStats.total * 100).toFixed(1);
  
  const report = `
=== تقرير استرداد البيانات ===
التاريخ: ${new Date().toLocaleString('ar-SA')}
إجمالي الطلبات: ${finalStats.total}
الطلبات المستردة: ${finalStats.total - finalStats.missing}
الطلبات المفقودة: ${finalStats.missing}
معدل النجاح: ${successRate}%

الحالة: ${finalStats.missing === 0 ? '✅ اكتمال الاسترداد' : '⚠️ استرداد جزئي'}
`;
  
  console.log(report);
  fs.writeFileSync(`recovery_report_${Date.now()}.txt`, report);
  
  return report;
}

async function main() {
  try {
    console.log('🚀 بدء عملية الاسترداد الشاملة...');
    
    // Step 1: Analyze current state
    const initialStats = await analyzeCurrentState();
    
    // Step 2: Create backup
    await createBackupFile();
    
    // Step 3: Attempt file recovery
    const recoveredCount = await attemptFileRecovery();
    
    // Step 4: Generate final report
    await generateRecoveryReport();
    
    console.log('🎯 اكتملت عملية الاسترداد بنجاح!');
    console.log(`📊 تم استرداد ${recoveredCount} ملف`);
    
  } catch (error) {
    console.error('💥 خطأ في عملية الاسترداد:', error);
  } finally {
    await client.end();
  }
}

// Run the recovery process
main();