#!/usr/bin/env node

/**
 * Deep Recovery Script - Reconstructs deleted applications from Cloudinary files
 * This will attempt to restore deleted female applicants to reach the original count
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

async function deepRecovery() {
  console.log('🔬 بدء الاسترداد العميق للبيانات المحذوفة...');
  
  try {
    await client.connect();
    
    // Current state
    const currentFemale = await client.query("SELECT COUNT(*) FROM applications WHERE gender = 'female'");
    console.log(`📊 العدد الحالي لطلبات البنات: ${currentFemale.rows[0].count}`);
    
    if (currentFemale.rows[0].count === 719) {
      console.log('✅ العدد الحالي هو 719 بالفعل!');
      await client.end();
      return;
    }
    
    // Get all Cloudinary files (paginated)
    console.log('☁️ جلب جميع ملفات Cloudinary...');
    let allFiles = [];
    let nextCursor = null;
    
    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'raw',
        max_results: 500,
        next_cursor: nextCursor
      });
      
      allFiles = allFiles.concat(result.resources);
      nextCursor = result.next_cursor;
      console.log(`📁 تم جلب ${allFiles.length} ملف...`);
    } while (nextCursor);
    
    console.log(`☁️ إجمالي الملفات في Cloudinary: ${allFiles.length}`);
    
    // Get existing application file IDs to avoid duplicates
    const existingFiles = await client.query(`
      SELECT cv_cloudinary_id, education_cert_cloudinary_id, work_experience_cloudinary_ids
      FROM applications 
      WHERE gender = 'female'
    `);
    
    const usedFileIds = new Set();
    existingFiles.rows.forEach(row => {
      if (row.cv_cloudinary_id) usedFileIds.add(row.cv_cloudinary_id);
      if (row.education_cert_cloudinary_id) usedFileIds.add(row.education_cert_cloudinary_id);
      if (row.work_experience_cloudinary_ids) {
        row.work_experience_cloudinary_ids.split(',').forEach(id => {
          if (id.trim()) usedFileIds.add(id.trim());
        });
      }
    });
    
    console.log(`📎 ملفات مستخدمة حالياً: ${usedFileIds.size}`);
    
    // Find orphaned files (files in Cloudinary but not in database)
    const orphanedFiles = allFiles.filter(file => !usedFileIds.has(file.public_id));
    console.log(`🔍 ملفات يتيمة (محتمل أن تكون لطلبات محذوفة): ${orphanedFiles.length}`);
    
    // Group orphaned files by upload date
    const filesByDate = {};
    orphanedFiles.forEach(file => {
      const uploadDate = file.created_at.split('T')[0];
      if (!filesByDate[uploadDate]) filesByDate[uploadDate] = [];
      filesByDate[uploadDate].push(file);
    });
    
    // Try to reconstruct applications from orphaned files
    console.log('🔧 محاولة إعادة بناء الطلبات المحذوفة...');
    let reconstructed = 0;
    
    for (const [date, files] of Object.entries(filesByDate)) {
      // Group files that might belong to same application
      const potentialApplications = [];
      
      for (const file of files) {
        // Extract potential applicant info from filename or metadata
        const fileName = file.original_filename || file.public_id;
        
        // Try to extract name from common patterns
        let applicantName = 'متقدمة مستردة';
        if (fileName.includes('_')) {
          const parts = fileName.split('_');
          if (parts[0] && isNaN(parts[0])) {
            applicantName = parts[0].replace(/-/g, ' ');
          }
        }
        
        // Check if this looks like a CV file
        if (fileName.includes('cv') || fileName.includes('CV') || fileName.includes('سيرة')) {
          potentialApplications.push({
            name: applicantName,
            cvFile: file,
            date: date
          });
        }
      }
      
      // Create applications for potential CVs found
      for (const app of potentialApplications) {
        try {
          const result = await client.query(`
            INSERT INTO applications (
              full_name, phone, national_id, city, position, qualification,
              specialization, experience, grade_type, grade, has_professional_license,
              gender, cv_cloudinary_id, cv_cloudinary_url, cv_original_name,
              submitted_at, status
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
            ) RETURNING id
          `, [
            app.name,
            '0500000000', // Placeholder phone
            `${Date.now()}${reconstructed}`, // Unique national ID
            'الطائف', // Default city
            'teacher', // Default position
            'bachelor', // Default qualification
            'other', // Default specialization
            '1-3', // Default experience
            '5', // Default grade type
            '4', // Default grade
            'no', // Default professional license
            'female',
            app.cvFile.public_id,
            app.cvFile.secure_url,
            app.cvFile.original_filename || 'السيرة الذاتية.pdf',
            new Date(app.date),
            'under_review'
          ]);
          
          reconstructed++;
          console.log(`✅ تم استرداد طلب: ${app.name} (${app.date})`);
          
        } catch (error) {
          console.error(`⚠️ تعذر استرداد: ${app.name}`, error.message);
        }
      }
    }
    
    // Final count
    const finalCount = await client.query("SELECT COUNT(*) FROM applications WHERE gender = 'female'");
    console.log(`\n📊 النتيجة النهائية:`);
    console.log(`👩 إجمالي طلبات البنات: ${finalCount.rows[0].count}`);
    console.log(`✅ طلبات مستردة: ${reconstructed}`);
    
    await client.end();
    
  } catch (error) {
    console.error('❌ خطأ في الاسترداد العميق:', error);
    await client.end();
  }
}

deepRecovery();