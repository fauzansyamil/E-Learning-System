// update-passwords.js
// Script untuk update semua password users dengan hash yang benar
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function updatePasswords() {
  console.log('🔐 Updating User Passwords...\n');

  try {
    // Connect to database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'elearning_db'
    });

    console.log('✅ Connected to database\n');

    // Define passwords
    const passwords = {
      admin: 'admin123',
      dosen: 'dosen123',
      mahasiswa: 'mhs123'
    };

    // Generate hashes
    console.log('🔄 Generating password hashes...');
    const adminHash = await bcrypt.hash(passwords.admin, 10);
    const dosenHash = await bcrypt.hash(passwords.dosen, 10);
    const mhsHash = await bcrypt.hash(passwords.mahasiswa, 10);
    console.log('✅ Hashes generated\n');

    // Update users
    const users = [
      { username: 'admin', hash: adminHash, name: 'Admin' },
      { username: 'dosen1', hash: dosenHash, name: 'Dosen 1' },
      { username: 'dosen2', hash: dosenHash, name: 'Dosen 2' },
      { username: 'mhs001', hash: mhsHash, name: 'Mahasiswa 001' },
      { username: 'mhs002', hash: mhsHash, name: 'Mahasiswa 002' },
      { username: 'mhs003', hash: mhsHash, name: 'Mahasiswa 003' }
    ];

    console.log('🔄 Updating passwords in database...\n');

    for (const user of users) {
      try {
        const [result] = await connection.execute(
          'UPDATE users SET password_hash = ? WHERE username = ?',
          [user.hash, user.username]
        );

        if (result.affectedRows > 0) {
          console.log(`✅ Updated: ${user.username.padEnd(10)} (${user.name})`);
        } else {
          console.log(`⚠️  Not found: ${user.username}`);
        }
      } catch (err) {
        console.error(`❌ Error updating ${user.username}:`, err.message);
      }
    }

    // Verify
    console.log('\n🔍 Verifying updates...');
    const [rows] = await connection.execute(
      'SELECT username, email, full_name, LEFT(password_hash, 20) as hash_preview FROM users ORDER BY id'
    );

    console.log('\n📋 Current Users:');
    console.table(rows);

    console.log('\n🎉 All passwords updated successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍💼 Admin:     admin / admin123');
    console.log('👨‍🏫 Dosen 1:   dosen1 / dosen123');
    console.log('👨‍🏫 Dosen 2:   dosen2 / dosen123');
    console.log('👨‍🎓 Mahasiswa 1: mhs001 / mhs123');
    console.log('👨‍🎓 Mahasiswa 2: mhs002 / mhs123');
    console.log('👨‍🎓 Mahasiswa 3: mhs003 / mhs123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await connection.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Database "elearning_db" not found. Please create it first:');
      console.error('   mysql -u root -p');
      console.error('   CREATE DATABASE elearning_db;');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Access denied. Check your .env file:');
      console.error('   DB_USER and DB_PASSWORD must be correct');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Cannot connect to MySQL. Make sure MySQL is running:');
      console.error('   net start MySQL80');
    }
    process.exit(1);
  }
}

// Run the script
updatePasswords();