/**
 * ZettCBT Pro - Centralized Database Configuration Vault
 * Instansi: SD NEGERI 14 TOBOALI
 * 
 * Berkas ini diletakkan di root (folder utama) repository projek Anda.
 * Berfungsi menghubungkan HP Siswa, Laptop Guru, dan PC Lab secara seragam
 * langsung ke Database Neon Cloud (PostgreSQL).
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

