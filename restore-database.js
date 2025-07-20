// Database Recovery Script
import { Pool } from 'pg';
import recoveryData from './recover-data.js';

async function restoreDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting database recovery...');
    
    // Insert each recovered application
    for (let i = 0; i < recoveryData.length; i++) {
      const app = recoveryData[i];
      
      const query = `
        INSERT INTO applications (
          full_name, phone, national_id, city, birth_date, position, 
          qualification, specialization, experience, grade_type, grade,
          has_professional_license, gender, status, submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `;
      
      const values = [
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
      ];
      
      const result = await pool.query(query, values);
      console.log(`✓ Restored applicant ${i + 1}/${recoveryData.length}: ${app.fullName} (ID: ${result.rows[0].id})`);
    }
    
    console.log(`\n🎉 Successfully restored ${recoveryData.length} applications!`);
    
    // Verify the restoration
    const countResult = await pool.query('SELECT COUNT(*) as total FROM applications');
    console.log(`📊 Total applications in database: ${countResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Error during recovery:', error);
  } finally {
    await pool.end();
  }
}

restoreDatabase();