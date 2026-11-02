/**
 * ZettCBT Pro - Centralized Database Configuration Vault
 * Instansi: SD NEGERI 14 TOBOALI
 * 
 * Berkas ini memastikan seluruh perangkat (Laptop Guru, PC Lab, dan Smartphone HP Siswa/Pengawas)
 * otomatis terhubung ke Database Neon Cloud (PostgreSQL) yang sama tanpa perbedaan data.
 */

(function() {
  if (typeof window === 'undefined') return;
  var existing = window.DEFAULT_NEON_CONFIG || {};

  window.DEFAULT_NEON_CONFIG = {
    // Host / HTTP Endpoint Neon Resmi SD Negeri 14 Toboali
    host: "ep-soft-dust-aozrpt7t-pooler.c-2.ap-southeast-1.aws.neon.tech",
    
    // Database Password role neondb_owner atau Token API
    password: (existing.password && existing.password.trim().length > 0) ? existing.password.trim() : "",
    
    // Database Name & Role Default
    database: existing.database || "neondb",
    user: existing.user || "neondb_owner",
    
    // Provider aktif ('neon' | 'supabase' | 'local')
    provider: existing.provider || "neon"
  };
})();
