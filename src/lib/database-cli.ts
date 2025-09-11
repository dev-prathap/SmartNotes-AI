#!/usr/bin/env bun
// Database CLI utility for SmartNotes AI

import { query } from './database';

async function runQuery(sql: string) {
  try {
    const result = await query(sql);
    console.log('Query result:', result.rows);
    return result.rows;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// Check if vector extension is enabled
async function checkVectorExtension() {
  try {
    const result = await runQuery(`
      SELECT name, default_version, installed_version 
      FROM pg_available_extensions 
      WHERE name = 'vector'
    `);
    
    if (result.length > 0) {
      const extension = result[0];
      console.log('Vector extension info:', extension);
      
      if (extension.installed_version) {
        console.log('✅ Vector extension is installed and enabled');
      } else {
        console.log('⚠️ Vector extension is available but not installed');
      }
    } else {
      console.log('❌ Vector extension is not available');
    }
  } catch (error) {
    console.error('Error checking vector extension:', error);
  }
}

// Main CLI entry point
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: bun run database-cli.ts <sql-query>');
    return;
  }
  
  const sql = args.join(' ');
  
  if (sql.toLowerCase().includes('vector')) {
    await checkVectorExtension();
  }
  
  await runQuery(sql);
}

main();
