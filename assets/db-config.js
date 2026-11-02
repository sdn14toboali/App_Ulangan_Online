/**
 * ZettCBT Pro - Centralized Database Configuration Vault
 * Instansi: SD NEGERI 14 TOBOALI
 * 
 * Berkas ini berfungsi memastikan kredensial database Neon PostgreSQL 
 * otomatis aktif dan seragam di seluruh perangkat (Laptop Guru, PC Lab, dan Smartphone HP Siswa).
 * 
 * Pengguna dapat menempelkan Host & Password Neon resmi di bawah ini agar 
 * seluruh perangkat langsung tersambung otomatis tanpa perlu konfigurasi manual.
 */

window.DEFAULT_NEON_CONFIG = {
  // Host / HTTP Endpoint Neon (Contoh: ep-cool-fog-123456.ap-southeast-1.aws.neon.tech)
  host: "",
  
  // Database Password role neondb_owner atau Token API
  password: "",
  
  // Database Name & Role Default
  database: "neondb",
  user: "neondb_owner",
  
  // Provider aktif ('neon' | 'supabase' | 'local')
  provider: "neon"
};

