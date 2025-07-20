// Bulk Database Restoration Script
import { neon } from '@neondatabase/serverless';
import applicants from './full-recovery-script.js';

const sql = neon(process.env.DATABASE_URL);

async function bulkRestore() {
  console.log('Starting bulk restoration of 719 female applicants...');
  
  try {
    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    const batches = Math.ceil(applicants.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, applicants.length);
      const batch = applicants.slice(startIndex, endIndex);
      
      console.log(`Processing batch ${batchIndex + 1}/${batches} (${batch.length} applicants)...`);
      
      // Build bulk insert query
      const values = batch.map((app, index) => {
        const paramIndex = index * 15;
        return `($${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, $${paramIndex + 13}, $${paramIndex + 14}, $${paramIndex + 15})`;
      }).join(', ');
      
      const query = `
        INSERT INTO applications (
          full_name, phone, national_id, city, birth_date, position,
          qualification, specialization, experience, grade_type, grade,
          has_professional_license, gender, status, submitted_at
        ) VALUES ${values}
      `;
      
      // Flatten parameters
      const params = batch.flatMap(app => [
        app.fullName,
        app.phone,
        app.nationalId,
        app.city,
        app.birthDate,
        app.position,
        app.qualification,
        app.specialization,
        app.experience,
        app.gradeType,
        app.grade,
        app.hasProfessionalLicense,
        app.gender,
        app.status,
        app.submittedAt
      ]);
      
      await sql(query, params);
      console.log(`✓ Batch ${batchIndex + 1} completed (${endIndex} total applicants restored)`);
    }
    
    // Verify restoration
    const [result] = await sql`SELECT COUNT(*) as total FROM applications WHERE gender = 'female'`;
    console.log(`\n🎉 SUCCESS! Restored ${result.total} female applications!`);
    
    // Show distribution
    const [stats] = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN position = 'teacher' THEN 1 END) as teachers,
        COUNT(CASE WHEN position = 'admin' THEN 1 END) as admin,
        COUNT(CASE WHEN position = 'vice_principal' THEN 1 END) as vice_principals,
        COUNT(CASE WHEN position = 'principal' THEN 1 END) as principals
      FROM applications WHERE gender = 'female'
    `;
    
    console.log('\n📊 Position Distribution:');
    console.log(`Total: ${stats.total}`);
    console.log(`Teachers: ${stats.teachers}`);
    console.log(`Admin: ${stats.admin}`);
    console.log(`Vice Principals: ${stats.vice_principals}`);
    console.log(`Principals: ${stats.principals}`);
    
  } catch (error) {
    console.error('❌ Error during bulk restoration:', error);
  }
}

bulkRestore();