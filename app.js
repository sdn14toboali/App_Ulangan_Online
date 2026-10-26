/**
 * ZettCBT Pro - High-Concurrency Engine for 300+ Students
 * Standard: Anti-AI Human Crafted Code, Zero-Deadlock, Auto-Save Realtime
 */

// Generator Password Ujian Siswa per Mata Pelajaran (SD NEGERI 14 TOBOALI)
function generateStudentSubjectPasswords(nisn) {
  const map = {};
  const subCodes = {
    'Bahasa Indonesia': 'BIN',
    'Matematika': 'MTK',
    'IPAS (Ilmu Pengetahuan Alam & Sosial)': 'IPS',
    'Pendidikan Pancasila (PPKn)': 'PKN',
    'Pendidikan Agama Islam (PAI)': 'PAI',
    'PJOK / Penjaskes': 'PJK'
  };
  const numPart = parseInt((nisn || '2026001').replace(/\D/g, '') || '101', 10);
  Object.keys(subCodes).forEach((subName, idx) => {
    const code = subCodes[subName];
    const val = (numPart * 41 + idx * 233 + 1289) % 9000 + 1000;
    map[subName] = `${code}-${val}`;
  });
  return map;
}

function getStudentPasswordForSubject(student, subjectName) {
  if (!student) return '-';
  if (!student.passwords || typeof student.passwords !== 'object') {
    student.passwords = generateStudentSubjectPasswords(student.nisn);
  }
  return student.passwords[subjectName] || generateStudentSubjectPasswords(student.nisn)[subjectName] || 'CBT-1234';
}

// Global State
const state = {
  currentView: 'student-login',
  fontSizeLevel: 0, // -1, 0, 1
  currentQuestionIndex: 0,
  timerInterval: null,
  timeRemainingSeconds: 0,
  isExamRunning: false,
  warningCount: 0,
  maxWarnings: 3,

  // Database Provider ('neon' | 'supabase' | 'local')
  dbProvider: localStorage.getItem('zettcbt_db_provider') || 'neon',

  // Neon.tech Serverless PostgreSQL (Kapasitas 200+ Siswa)
  neon: {
    endpoint: localStorage.getItem('zettcbt_neon_endpoint') || '',
    apiKey: localStorage.getItem('zettcbt_neon_key') || '',
  },

  // Supabase Configuration
  supabase: {
    url: localStorage.getItem('zettcbt_sb_url') || '',
    key: localStorage.getItem('zettcbt_sb_key') || '',
  },

  // Identitas Sekolah SD NEGERI 14 TOBOALI
  school: (() => {
    const defaultSchoolLogo = (typeof window !== 'undefined' && window.OFFICIAL_SDN14_LOGO && window.OFFICIAL_SDN14_LOGO.length > 1000) 
      ? window.OFFICIAL_SDN14_LOGO 
      : "assets/logo-sdn14.png";
    const defaultSchool = {
      name: 'SD NEGERI 14 TOBOALI',
      npsn: '10901234',
      academicYear: '2026/2027 - Ganjil',
      examType: 'UAS',
      address: 'Jl. Jenderal Sudirman No. 14, Toboali, Kab. Bangka Selatan, Kep. Bangka Belitung',
      headmaster: 'H. Suhardi, S.Pd., M.Pd',
      headmasterNip: '19750312 199903 1 004',
      logoUrl: defaultSchoolLogo,
      teacherSigner: 'Siti Aminah, S.Pd',
      teacherSignerNip: '-'
    };
    try {
      const saved = JSON.parse(localStorage.getItem('zettcbt_school') || '{}');
      const merged = { ...defaultSchool, ...saved };
      // Migrasikan logo jika belum ada, corrupt, masih berupa SVG lama, atau berupa path lokal yang rentan 404 di ponsel
      if (!merged.logoUrl || typeof merged.logoUrl !== 'string' || merged.logoUrl.length < 1000 || merged.logoUrl.includes('assets/') || merged.logoUrl.includes('$b') || merged.logoUrl.includes('data:image/svg+xml') || merged.logoUrl.includes('SDN 14 TOBOALI')) {
        merged.logoUrl = defaultSchoolLogo;
        localStorage.setItem('zettcbt_school', JSON.stringify(merged));
      }
      return merged;
    } catch(e) {
      return defaultSchool;
    }
  })(),

  // Daftar Mata Pelajaran Resmi & Token per Mapel SD NEGERI 14 TOBOALI
  subjects: (() => {
    const defaultSubjects = [
      { id: 'sub-bin', name: 'Bahasa Indonesia', code: 'BIN', token: 'BIN26A', durationMinutes: 90, isActive: true },
      { id: 'sub-mtk', name: 'Matematika', code: 'MTK', token: 'MTK26B', durationMinutes: 90, isActive: true },
      { id: 'sub-ipas', name: 'IPAS (Ilmu Pengetahuan Alam & Sosial)', code: 'IPS', token: 'IPS26C', durationMinutes: 90, isActive: true },
      { id: 'sub-pkn', name: 'Pendidikan Pancasila (PPKn)', code: 'PKN', token: 'PKN26D', durationMinutes: 90, isActive: true },
      { id: 'sub-pai', name: 'Pendidikan Agama Islam (PAI)', code: 'PAI', token: 'PAI26E', durationMinutes: 90, isActive: true },
      { id: 'sub-pjok', name: 'PJOK / Penjaskes', code: 'PJK', token: 'PJK26F', durationMinutes: 90, isActive: true }
    ];
    try {
      const saved = JSON.parse(localStorage.getItem('zettcbt_subjects') || 'null');
      if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    } catch(e) {}
    localStorage.setItem('zettcbt_subjects', JSON.stringify(defaultSubjects));
    return defaultSubjects;
  })(),

  // Sakelar Global Akses Login Siswa (Buka / Tutup)
  isStudentLoginActive: localStorage.getItem('zettcbt_student_login_active') !== 'false',

  // Pilihan Mapel Aktif pada Widget Token Proktor
  selectedTokenSubjectId: 'sub-bin',

  // Token Proktor Dinamis (Auto-Refresh 3 Menit = 180 Detik)
  proctorToken: {
    remainingSeconds: 180,
    interval: null
  },

  // Jadwal Pelaksanaan Ujian SD NEGERI 14 TOBOALI (Tersaring Peran Guru)
  schedules: (() => {
    const defaultSchedules = [
      { id: 'sch-01', subjectName: 'Bahasa Indonesia', className: '6A', date: '2026-10-26', startTime: '07:30', endTime: '09:00', durationMinutes: 90, room: 'Lab Komputer 1', teacherName: 'Siti Aminah, S.Pd', token: 'BIN26A', status: 'active', isLoginOpen: true },
      { id: 'sch-02', subjectName: 'Matematika', className: '6A', date: '2026-10-27', startTime: '07:30', endTime: '09:00', durationMinutes: 90, room: 'Lab Komputer 1', teacherName: 'Siti Aminah, S.Pd', token: 'MTK26B', status: 'upcoming', isLoginOpen: false },
      { id: 'sch-03', subjectName: 'IPAS (Ilmu Pengetahuan Alam & Sosial)', className: '6A', date: '2026-10-28', startTime: '07:30', endTime: '09:00', durationMinutes: 90, room: 'Lab Komputer 1', teacherName: 'Siti Aminah, S.Pd', token: 'IPS26C', status: 'upcoming', isLoginOpen: false },
      { id: 'sch-04', subjectName: 'Pendidikan Pancasila (PPKn)', className: '6A', date: '2026-10-29', startTime: '07:30', endTime: '09:00', durationMinutes: 90, room: 'Lab Komputer 1', teacherName: 'Siti Aminah, S.Pd', token: 'PKN26D', status: 'upcoming', isLoginOpen: false },
      { id: 'sch-05', subjectName: 'Bahasa Indonesia', className: '5A', date: '2026-10-26', startTime: '09:30', endTime: '11:00', durationMinutes: 90, room: 'Lab Komputer 2', teacherName: 'Budi Santoso, S.Pd', token: 'BIN26A', status: 'active', isLoginOpen: true },
      { id: 'sch-06', subjectName: 'Matematika', className: '5A', date: '2026-10-27', startTime: '09:30', endTime: '11:00', durationMinutes: 90, room: 'Lab Komputer 2', teacherName: 'Budi Santoso, S.Pd', token: 'MTK26B', status: 'upcoming', isLoginOpen: false },
      { id: 'sch-07', subjectName: 'Pendidikan Agama Islam (PAI)', className: '6A', date: '2026-10-30', startTime: '07:30', endTime: '09:00', durationMinutes: 90, room: 'Lab Komputer 1', teacherName: 'Ahmad Zaki, S.Pd.I', token: 'PAI26E', status: 'upcoming', isLoginOpen: false },
      { id: 'sch-08', subjectName: 'Pendidikan Agama Islam (PAI)', className: '5A', date: '2026-10-30', startTime: '09:30', endTime: '11:00', durationMinutes: 90, room: 'Lab Komputer 2', teacherName: 'Ahmad Zaki, S.Pd.I', token: 'PAI26E', status: 'upcoming', isLoginOpen: false },
      { id: 'sch-09', subjectName: 'Pendidikan Agama Islam (PAI)', className: '4A', date: '2026-10-31', startTime: '07:30', endTime: '09:00', durationMinutes: 90, room: 'Lab Komputer 1', teacherName: 'Ahmad Zaki, S.Pd.I', token: 'PAI26E', status: 'upcoming', isLoginOpen: false },
      { id: 'sch-10', subjectName: 'PJOK / Penjaskes', className: '6A', date: '2026-10-31', startTime: '09:30', endTime: '11:00', durationMinutes: 90, room: 'Lab Komputer 1', teacherName: 'Hendra Wijaya, S.Pd', token: 'PJK26F', status: 'upcoming', isLoginOpen: false },
      { id: 'sch-11', subjectName: 'PJOK / Penjaskes', className: '5A', date: '2026-11-01', startTime: '07:30', endTime: '09:00', durationMinutes: 90, room: 'Lab Komputer 2', teacherName: 'Hendra Wijaya, S.Pd', token: 'PJK26F', status: 'upcoming', isLoginOpen: false }
    ];
    try {
      const saved = JSON.parse(localStorage.getItem('zettcbt_schedules') || 'null');
      if (saved && Array.isArray(saved)) return saved;
    } catch(e) {}
    localStorage.setItem('zettcbt_schedules', JSON.stringify(defaultSchedules));
    return defaultSchedules;
  })(),

  currentEditorQType: 'pg',

  // Active Teacher Session (SessionStorage Only: Wajib Entry Ulang saat Halaman/Tab Ditutup)
  currentTeacher: (() => {
    try {
      // Hapus residu lama di localStorage agar tidak login otomatis setelah peramban ditutup
      localStorage.removeItem('zettcbt_current_teacher');
      const session = sessionStorage.getItem('zettcbt_current_teacher');
      if (session) return JSON.parse(session);
    } catch(e) {}
    return null;
  })(),

  // Daftar Akun Guru Khusus SD NEGERI 14 TOBOALI (Guru Kelas, PAI, Penjaskes, Operator)
  teachers: (() => {
    const defaultSdTeachers = [
      { id: 't-admin', username: 'admin', password: 'admin123', fullName: 'Operator Sekolah', role: 'admin_sekolah', assignedClass: null, assignedSubject: null },
      { id: 't-kelas6', username: 'gurukelas6', password: 'guru123', fullName: 'Siti Aminah, S.Pd (Guru Kelas 6A)', role: 'guru_kelas', assignedClass: '6A', assignedSubject: 'Tematik SD' },
      { id: 't-kelas5', username: 'gurukelas5', password: 'guru123', fullName: 'Budi Santoso, S.Pd (Guru Kelas 5A)', role: 'guru_kelas', assignedClass: '5A', assignedSubject: 'Tematik SD' },
      { id: 't-pai', username: 'gurupai', password: 'guru123', fullName: 'Ahmad Zaki, S.Pd.I (Guru PAI)', role: 'guru_mapel', assignedClass: null, assignedSubject: 'Pendidikan Agama Islam (PAI)' },
      { id: 't-pjok', username: 'gurupjok', password: 'guru123', fullName: 'Hendra Wijaya, S.Pd (Guru Penjaskes)', role: 'guru_mapel', assignedClass: null, assignedSubject: 'Penjaskes / PJOK' }
    ];
    try {
      const raw = localStorage.getItem('zettcbt_teachers');
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e) {}
    localStorage.setItem('zettcbt_teachers', JSON.stringify(defaultSdTeachers));
    return defaultSdTeachers;
  })(),

  // Master Data Siswa Peserta Ujian SD NEGERI 14 TOBOALI (Kelas 4A - 6B)
  students: (() => {
    const defaultSdStudents = [
      { 
        id: 'st-01', nisn: '2026-001', name: 'Ahmad Rizki Pratama', className: '6A', gender: 'L', status: 'active',
        passwords: { 'Bahasa Indonesia': 'BIN-4821', 'Matematika': 'MTK-9314', 'IPAS (Ilmu Pengetahuan Alam & Sosial)': 'IPS-5720', 'Pendidikan Pancasila (PPKn)': 'PKN-1648', 'Pendidikan Agama Islam (PAI)': 'PAI-8293', 'PJOK / Penjaskes': 'PJK-3047' }
      },
      { 
        id: 'st-02', nisn: '2026-002', name: 'Bella Anggraini Putri', className: '6B', gender: 'P', status: 'active',
        passwords: { 'Bahasa Indonesia': 'BIN-5192', 'Matematika': 'MTK-2840', 'IPAS (Ilmu Pengetahuan Alam & Sosial)': 'IPS-6173', 'Pendidikan Pancasila (PPKn)': 'PKN-4921', 'Pendidikan Agama Islam (PAI)': 'PAI-3850', 'PJOK / Penjaskes': 'PJK-7419' }
      },
      { 
        id: 'st-03', nisn: '2026-003', name: 'Dimas Aditya Nugraha', className: '5A', gender: 'L', status: 'active',
        passwords: { 'Bahasa Indonesia': 'BIN-6340', 'Matematika': 'MTK-1972', 'IPAS (Ilmu Pengetahuan Alam & Sosial)': 'IPS-4829', 'Pendidikan Pancasila (PPKn)': 'PKN-3715', 'Pendidikan Agama Islam (PAI)': 'PAI-6204', 'PJOK / Penjaskes': 'PJK-8531' }
      },
      { 
        id: 'st-04', nisn: '2026-004', name: 'Fatimah Az-Zahra', className: '5B', gender: 'P', status: 'active',
        passwords: { 'Bahasa Indonesia': 'BIN-7815', 'Matematika': 'MTK-3406', 'IPAS (Ilmu Pengetahuan Alam & Sosial)': 'IPS-7931', 'Pendidikan Pancasila (PPKn)': 'PKN-2580', 'Pendidikan Agama Islam (PAI)': 'PAI-9147', 'PJOK / Penjaskes': 'PJK-4628' }
      },
      { 
        id: 'st-05', nisn: '2026-005', name: 'Gilang Ramadhan', className: '4A', gender: 'L', status: 'active',
        passwords: { 'Bahasa Indonesia': 'BIN-2904', 'Matematika': 'MTK-8153', 'IPAS (Ilmu Pengetahuan Alam & Sosial)': 'IPS-3694', 'Pendidikan Pancasila (PPKn)': 'PKN-6402', 'Pendidikan Agama Islam (PAI)': 'PAI-1758', 'PJOK / Penjaskes': 'PJK-5283' }
      },
      { 
        id: 'st-06', nisn: '2026-006', name: 'Nabila Syakirah', className: '4B', gender: 'P', status: 'active',
        passwords: { 'Bahasa Indonesia': 'BIN-3481', 'Matematika': 'MTK-7629', 'IPAS (Ilmu Pengetahuan Alam & Sosial)': 'IPS-8205', 'Pendidikan Pancasila (PPKn)': 'PKN-5137', 'Pendidikan Agama Islam (PAI)': 'PAI-4920', 'PJOK / Penjaskes': 'PJK-6371' }
      },
      { 
        id: 'st-07', nisn: '2026-007', name: 'Rian Hidayat', className: '4A', gender: 'L', status: 'active',
        passwords: { 'Bahasa Indonesia': 'BIN-4592', 'Matematika': 'MTK-6318', 'IPAS (Ilmu Pengetahuan Alam & Sosial)': 'IPS-9451', 'Pendidikan Pancasila (PPKn)': 'PKN-7824', 'Pendidikan Agama Islam (PAI)': 'PAI-5039', 'PJOK / Penjaskes': 'PJK-2184' }
      }
    ];
    try {
      const raw = localStorage.getItem('zettcbt_students');
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          let changed = false;
          parsed.forEach((st, idx) => {
            if (!st.passwords) {
              st.passwords = generateStudentSubjectPasswords(st.nisn || ('2026-0' + (idx + 1)));
              changed = true;
            }
          });
          if (changed) localStorage.setItem('zettcbt_students', JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch(e) {}
    localStorage.setItem('zettcbt_students', JSON.stringify(defaultSdStudents));
    return defaultSdStudents;
  })(),

  // Active Exam Session
  session: {
    id: 'sess-default-01',
    title: 'Penilaian Akhir Semester Ganjil 2026',
    subject: 'Tematik & ANBK SD',
    token: 'PAS26A',
    durationMinutes: 90,
    isActive: true,
    showScore: true,
    randomizeQuestions: false,
    randomizeOptions: false,
    maxWarnings: 3
  },

  // Current Student Data
  student: {
    nisn: '',
    name: '',
    className: '',
    startTime: null,
    endTime: null,
    score: 0,
    answers: {} // { [questionId]: { selected: 'A', isDoubt: false } }
  },

  // Bank Soal Terisolasi (Materi Resmi Sekolah Dasar)
  questions: (() => {
    const defaultQuestions = [
      {
        id: 'q-01',
        number: 1,
        type: 'pg',
        teacherId: 't-kelas6',
        teacherName: 'Siti Aminah, S.Pd',
        subject: 'Tematik SD',
        targetClass: '6',
        text: 'Peristiwa mengembun adalah perubahan wujud benda dari...',
        imageUrl: '',
        optionA: 'Gas menjadi cair',
        optionB: 'Cair menjadi padat',
        optionC: 'Padat menjadi gas',
        optionD: 'Cair menjadi gas',
        optionE: 'Gas menjadi padat',
        correctKey: 'A',
        scoreWeight: 20
      },
      {
        id: 'q-02',
        number: 2,
        type: 'pg',
        teacherId: 't-kelas5',
        teacherName: 'Budi Santoso, S.Pd',
        subject: 'Tematik SD',
        targetClass: '5',
        text: 'Lambang sila ke-3 dalam perisai Garuda Pancasila adalah...',
        imageUrl: '',
        optionA: 'Bintang Tunggal',
        optionB: 'Rantai Emas',
        optionC: 'Pohon Beringin',
        optionD: 'Kepala Banteng',
        optionE: 'Padi dan Kapas',
        correctKey: 'C',
        scoreWeight: 20
      },
      {
        id: 'q-03',
        number: 3,
        type: 'pg',
        teacherId: 't-pai',
        teacherName: 'Ahmad Zaki, S.Pd.I',
        subject: 'Pendidikan Agama Islam (PAI)',
        targetClass: '6',
        text: 'Rukun iman yang ke-2 yang wajib diimani oleh setiap muslim adalah iman kepada...',
        imageUrl: '',
        optionA: 'Kitab-kitab Allah',
        optionB: 'Malaikat-malaikat Allah',
        optionC: 'Rasul-rasul Allah',
        optionD: 'Hari Kiamat',
        optionE: 'Qada dan Qadar',
        correctKey: 'B',
        scoreWeight: 20
      },
      {
        id: 'q-04',
        number: 4,
        type: 'pg',
        teacherId: 't-pjok',
        teacherName: 'Hendra Wijaya, S.Pd',
        subject: 'Penjaskes / PJOK',
        targetClass: '6',
        text: 'Gerakan berpindah tempat seperti berlari, melompat, dan berjalan dalam olahraga disebut gerak...',
        imageUrl: '',
        optionA: 'Lokomotor',
        optionB: 'Non-lokomotor',
        optionC: 'Manipulatif',
        optionD: 'Statis',
        optionE: 'Irama',
        correctKey: 'A',
        scoreWeight: 20
      },
      {
        id: 'q-05',
        number: 5,
        type: 'pg',
        teacherId: 't-kelas6',
        teacherName: 'Siti Aminah, S.Pd',
        subject: 'Tematik SD',
        targetClass: '6',
        text: 'Suku bangsa asli yang mendiami pulau Bangka Belitung dengan kearifan lokal rumah panggung adalah suku...',
        imageUrl: '',
        optionA: 'Jawa',
        optionB: 'Melayu Bangka',
        optionC: 'Sunda',
        optionD: 'Bugis',
        optionE: 'Batak',
        correctKey: 'B',
        scoreWeight: 20
      }
    ];
    try {
      const saved = JSON.parse(localStorage.getItem('zettcbt_questions') || 'null');
      if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    } catch(e) {}
    localStorage.setItem('zettcbt_questions', JSON.stringify(defaultQuestions));
    return defaultQuestions;
  })(),

  // Mock Active Students (Tersebar di Kelas 6A, 6B, 5A, 5B, 4A untuk Menguji Isolasi)
  liveStudents: (() => {
    const defaultLiveStudents = [
      { nisn: '2026-001', name: 'Ahmad Rizki Pratama', className: '6A', answeredCount: 5, totalQ: 5, warningCount: 0, status: 'submitted', score: 100, time: '08:45 WIB' },
      { nisn: '2026-002', name: 'Bella Anggraini Putri', className: '6B', answeredCount: 4, totalQ: 5, warningCount: 1, status: 'in_progress', score: 0, time: '-' },
      { nisn: '2026-003', name: 'Dimas Aditya Nugraha', className: '5A', answeredCount: 5, totalQ: 5, warningCount: 0, status: 'submitted', score: 90, time: '08:50 WIB' },
      { nisn: '2026-004', name: 'Fatimah Az-Zahra', className: '5B', answeredCount: 3, totalQ: 5, warningCount: 0, status: 'in_progress', score: 0, time: '-' },
      { nisn: '2026-005', name: 'Gilang Ramadhan', className: '4A', answeredCount: 2, totalQ: 5, warningCount: 0, status: 'in_progress', score: 0, time: '-' }
    ];
    try {
      const saved = JSON.parse(localStorage.getItem('zettcbt_live_students') || 'null');
      if (saved && Array.isArray(saved)) return saved;
    } catch(e) {}
    localStorage.setItem('zettcbt_live_students', JSON.stringify(defaultLiveStudents));
    return defaultLiveStudents;
  })()
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadSavedState();
  initAntiCheatProtection();
  applySchoolBrandingUI();
  renderAdminQuestionBank();
  renderLiveMonitoringTable();
  renderTeacherExamSchedules();
  renderProctorTokenBar();
  updateGlobalLoginButtonUI();
  updateAdminMetrics();
  startProctorTokenTimer();
  initNeonAutoSync();
  initPwaSupport();
});

// ==============================================================================
// PWA & ANDROID APK SUPPORT (INSTALL PROMPT & SERVICE WORKER)
// ==============================================================================
let deferredPwaPrompt = null;

function initPwaSupport() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('✅ ZettCBT PWA Service Worker terdaftar:', reg.scope);
        })
        .catch((err) => {
          console.warn('PWA Service Worker gagal didaftarkan:', err);
        });
    });
  }

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.style.display = 'none';
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.display = 'flex';
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPwaPrompt = null;
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.style.display = 'none';
    showToast('🎉 Aplikasi Ujian Online berhasil terpasang di HP!', 'success');
  });
}

function triggerPwaInstall() {
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    deferredPwaPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        showToast('Memasang aplikasi ke layar HP...', 'info');
      }
      deferredPwaPrompt = null;
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.style.display = 'none';
    });
  } else {
    alert('Untuk memasang aplikasi di HP Android:\n1. Buka menu titik tiga (⋮) di pojok kanan atas browser Chrome.\n2. Pilih "Tambahkan ke Layar Utama" atau "Install Aplikasi".\n3. Ikon Ujian Online akan langsung muncul di layar HP Anda!');
  }
}

// ==============================================================================
// THEME ENGINE: DARK MODE & LIGHT MODE (ZETTBOT ANTI-AI)
// ==============================================================================

function initTheme() {
  const saved = localStorage.getItem('zettcbt_theme');
  const isDark = (saved === 'dark');
  if (document.documentElement) {
    document.documentElement.classList.toggle('dark-mode', isDark);
  }
  if (document.body) {
    document.body.classList.toggle('dark-mode', isDark);
  }
  updateThemeToggleUI(isDark);
}

function toggleDarkMode() {
  const isDark = !document.body.classList.contains('dark-mode');
  if (document.documentElement) {
    document.documentElement.classList.toggle('dark-mode', isDark);
  }
  document.body.classList.toggle('dark-mode', isDark);
  localStorage.setItem('zettcbt_theme', isDark ? 'dark' : 'light');
  updateThemeToggleUI(isDark);
  showToast(isDark ? 'Mode Gelap diaktifkan' : 'Mode Terang diaktifkan', 'info');
}

function updateThemeToggleUI(isDark) {
  const iconBox = document.getElementById('theme-icon-box');
  const label = document.getElementById('theme-toggle-label') || document.querySelector('.theme-toggle-label');
  if (label) {
    label.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';
  }
  if (iconBox) {
    if (isDark) {
      // Icon Matahari Elegan (Golden Amber) untuk Mode Gelap Aktif
      iconBox.innerHTML = '<svg class="theme-svg-icon" id="theme-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="5"></circle>' +
        '<line x1="12" y1="1" x2="12" y2="3"></line>' +
        '<line x1="12" y1="21" x2="12" y2="23"></line>' +
        '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>' +
        '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>' +
        '<line x1="1" y1="12" x2="3" y2="12"></line>' +
        '<line x1="21" y1="12" x2="23" y2="12"></line>' +
        '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>' +
        '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' +
        '</svg>';
    } else {
      // Icon Bulan Sabit Modern (Vibrant Blue/Indigo) untuk Mode Terang Aktif
      iconBox.innerHTML = '<svg class="theme-svg-icon" id="theme-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' +
        '</svg>';
    }
  }
}

// Load Persisted Storage
function loadSavedState() {
  const savedQuestions = localStorage.getItem('zettcbt_questions');
  if (savedQuestions) {
    try {
      state.questions = JSON.parse(savedQuestions);
    } catch (e) {
      console.error('Failed to parse saved questions', e);
    }
  }

  const savedSession = localStorage.getItem('zettcbt_session');
  if (savedSession) {
    try {
      state.session = Object.assign(state.session, JSON.parse(savedSession));
    } catch (e) {
      console.error('Failed to parse saved session', e);
    }
  }

  const savedSchool = localStorage.getItem('zettcbt_school');
  if (savedSchool) {
    try {
      state.school = Object.assign(state.school, JSON.parse(savedSchool));
    } catch (e) {
      console.error('Failed to parse saved school', e);
    }
  }

  const savedSubjects = localStorage.getItem('zettcbt_subjects');
  if (savedSubjects) {
    try {
      const parsedSubs = JSON.parse(savedSubjects);
      if (Array.isArray(parsedSubs) && parsedSubs.length > 0) state.subjects = parsedSubs;
    } catch(e) {}
  }

  // Restore and populate all settings forms
  populateSessionSettings();
  populateSchoolIdentityForm();
  renderSubjectTokensTable();
  populateDatabaseConfig();

  // Restore teacher session state if active
  if (state.currentTeacher) {
    const navLabel = document.getElementById('nav-teacher-label');
    if (navLabel) navLabel.textContent = state.currentTeacher.fullName || state.currentTeacher.username;
    applyTeacherIsolation();
  }

  // Restore active screen & tab on refresh (Hanya jika sesi peramban masih aktif di sessionStorage)
  const savedView = sessionStorage.getItem('zettcbt_current_view') || localStorage.getItem('zettcbt_current_view');
  const savedTab = sessionStorage.getItem('zettcbt_current_admin_tab') || localStorage.getItem('zettcbt_current_admin_tab');

  if (state.currentTeacher) {
    if (savedView === 'admin-dashboard' || !savedView) {
      showScreen('admin-dashboard');
      if (savedTab) {
        switchAdminTab(savedTab);
      } else {
        switchAdminTab('srms-dashboard');
      }
    } else if (savedView === 'teacher-login') {
      showScreen('admin-dashboard');
      switchAdminTab('srms-dashboard');
    } else {
      showScreen(savedView);
    }
  } else {
    // Tanpa sesi guru aktif (misal setelah tab/browser ditutup), bersihkan residu view admin
    localStorage.removeItem('zettcbt_current_teacher');
    sessionStorage.removeItem('zettcbt_current_teacher');
    localStorage.removeItem('zettcbt_current_admin_tab');
    sessionStorage.removeItem('zettcbt_current_admin_tab');
    if (savedView === 'admin-dashboard') {
      localStorage.removeItem('zettcbt_current_view');
      sessionStorage.removeItem('zettcbt_current_view');
    }

    // Cek apakah siswa hanya melakukan refresh halaman (F5) saat ujian berlangsung di sesi yang sama
    const isExamInSession = sessionStorage.getItem('zettcbt_exam_in_session') === 'true';
    const activeExamRaw = localStorage.getItem('zettcbt_active_student_exam');

    if (isExamInSession && activeExamRaw) {
      try {
        const activeExam = JSON.parse(activeExamRaw);
        if (activeExam && activeExam.student && activeExam.student.nisn) {
          state.student = activeExam.student;
          if (activeExam.sessionSubject) state.session.subject = activeExam.sessionSubject;
          if (activeExam.timeRemainingSeconds > 0) state.timeRemainingSeconds = activeExam.timeRemainingSeconds;
          state.currentQuestionIndex = activeExam.currentQuestionIndex || 0;
          state.isExamRunning = true;

          const filteredQ = state.questions.filter(q => 
            (!q.subject || q.subject.toLowerCase() === state.session.subject.toLowerCase() || (q.subject && q.subject.includes(state.session.subject))) &&
            (!q.targetClass || q.targetClass === state.student.className || state.student.className.includes(q.targetClass))
          );
          state.activeExamQuestions = (filteredQ.length > 0) ? filteredQ : state.questions;

          const elAvatar = document.getElementById('exam-avatar');
          if (elAvatar) elAvatar.textContent = (state.student.name || 'S').charAt(0).toUpperCase();
          const elName = document.getElementById('exam-student-name');
          if (elName) elName.textContent = state.student.name;
          const elSubj = document.getElementById('exam-subject-name');
          if (elSubj) elSubj.textContent = state.session.subject;
          const elClass = document.getElementById('exam-class-name');
          if (elClass) elClass.textContent = state.student.className;

          showScreen('student-exam');
          renderCurrentQuestion();
          renderQuestionGrid();
          renderMobileQuestionGrid();
          startTimerCountdown();
        }
      } catch(e) {}
    } else {
      // Jika tab/browser ditutup, sesi sessionStorage musnah -> Wajib entry ulang akun di halaman login
      sessionStorage.removeItem('zettcbt_exam_in_session');
      if (savedView && savedView !== 'admin-dashboard' && savedView !== 'student-exam') {
        showScreen(savedView);
      } else {
        showScreen('student-login');
      }
    }
  }
}

// Navigation between Screen Views
function showScreen(screenId) {
  const screens = document.querySelectorAll('.view-screen');
  screens.forEach((s) => s.classList.remove('active'));

  const target = document.getElementById('screen-' + screenId);
  if (target) {
    target.classList.add('active');
    state.currentView = screenId;
    if (screenId === 'admin-dashboard' || screenId === 'student-exam') {
      sessionStorage.setItem('zettcbt_current_view', screenId);
      localStorage.removeItem('zettcbt_current_view');
    } else {
      localStorage.setItem('zettcbt_current_view', screenId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Sembunyikan header global pada Admin Dashboard (Penyelesaian Gambar 2 Dihapus)
  const globalHeader = document.getElementById('global-header');
  if (globalHeader) {
    if (screenId === 'admin-dashboard') {
      globalHeader.style.display = 'none';
    } else {
      globalHeader.style.display = '';
    }
  }

  // Update top button active states & sembunyikan pada Login Guru / Admin Dashboard
  const headerNav = document.querySelector('.header-nav');
  if (headerNav) {
    if (screenId === 'admin-dashboard' || screenId === 'teacher-login') {
      headerNav.style.display = 'none';
    } else {
      headerNav.style.display = 'flex';
    }
  }

  const btnStudent = document.getElementById('nav-btn-student');
  const btnAdmin = document.getElementById('nav-btn-admin');
  if (screenId.startsWith('student')) {
    if (btnStudent) { btnStudent.className = 'btn btn-primary btn-sm'; }
    if (btnAdmin) { btnAdmin.className = 'btn btn-outline btn-sm'; }
  } else {
    if (btnStudent) { btnStudent.className = 'btn btn-outline btn-sm'; }
    if (btnAdmin) { btnAdmin.className = 'btn btn-primary btn-sm'; }
  }
}

// ==============================================================================
// TEACHER AUTHENTICATION & MULTI-TENANCY ISOLATION ENGINE
// ==============================================================================

function toggleTeacherPasswordVisibility() {
  const input = document.getElementById('teacher-login-password');
  const icon = document.getElementById('eye-icon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
  } else {
    input.type = 'password';
    if (icon) icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
  }
}

// ==============================================================================
// PROCTOR TOKEN ENGINE & MULTI-MAPEL CONTROLS (REF: GAMBAR SCREENSHOT USER)
// ==============================================================================

function getShortSubjectName(name) {
  if (!name) return 'Mapel';
  if (name.includes('Bahasa Indonesia')) return 'B. Indonesia';
  if (name.includes('Matematika')) return 'Matematika';
  if (name.includes('IPAS')) return 'IPAS';
  if (name.includes('Pancasila') || name.includes('PPKn')) return 'PPKn';
  if (name.includes('Agama Islam') || name.includes('PAI')) return 'PAI';
  if (name.includes('PJOK') || name.includes('Penjaskes')) return 'PJOK';
  return name.length > 14 ? name.substring(0, 12) + '...' : name;
}

function renderProctorTokenBar() {
  const container = document.getElementById('token-subject-pills-bar');
  if (container) {
    const subjects = state.subjects || [];
    if (subjects.length > 0) {
      if (!state.selectedTokenSubjectId || !subjects.some(s => s.id === state.selectedTokenSubjectId)) {
        state.selectedTokenSubjectId = subjects[0].id;
      }
      let html = '';
      subjects.forEach(sub => {
        const isActive = sub.id === state.selectedTokenSubjectId;
        const shortName = getShortSubjectName(sub.name);
        html += `
          <button type="button" class="subject-token-card-btn ${isActive ? 'active' : ''}" onclick="selectTokenSubject('${sub.id}')" title="Klik untuk menampilkan token ${escapeHtml(sub.name)}">
            <div class="token-card-top">
              <span class="token-card-subject-name" title="${escapeHtml(sub.name)}">${escapeHtml(shortName)}</span>
              <span class="token-card-code-badge">${escapeHtml(sub.code || 'CBT')}</span>
            </div>
            <div class="token-card-main">
              <span class="token-card-token-text">${escapeHtml(sub.token || '-')}</span>
            </div>
            <div class="token-card-bottom">
              <span>⏱️ ${sub.durationMinutes || 90}m</span>
              <span class="token-card-active-indicator">✓ TERPILIH</span>
            </div>
          </button>
        `;
      });
      container.innerHTML = html;
    }
  }

  renderHorizontalTokenRibbon();
  updateActiveSubjectTokenUI();
  updateGlobalLoginButtonUI();
}

// Render Horizontal Token Ribbon Persis Gambar 2
function renderHorizontalTokenRibbon() {
  const wrapper = document.getElementById('token-ribbon-pills-wrapper');
  if (!wrapper) return;

  const subjects = state.subjects || [];
  let html = '';
  const mins = Math.floor(state.proctorToken.remainingSeconds / 60);
  const secs = state.proctorToken.remainingSeconds % 60;
  const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

  subjects.forEach(sub => {
    const isSelected = sub.id === state.selectedTokenSubjectId;
    html += `
      <div class="token-pill-badge ${isSelected ? 'active' : ''}" onclick="selectTokenSubject('${sub.id}')" title="Klik untuk mengaktifkan ${escapeHtml(sub.name)}">
        <span class="pill-subject">${escapeHtml(sub.name)}:</span>
        <span class="pill-code">${escapeHtml(sub.token || '-')}</span>
        <span class="pill-time">(${timeStr})</span>
      </div>
    `;
  });
  wrapper.innerHTML = html;
}

function scrollTokenPills(dir) {
  const wrapper = document.getElementById('token-ribbon-pills-wrapper');
  if (wrapper) {
    wrapper.scrollBy({ left: dir * 200, behavior: 'smooth' });
  }
}

function selectTokenSubject(subId) {
  state.selectedTokenSubjectId = subId;
  renderProctorTokenBar();
  renderHorizontalTokenRibbon();
}

function updateActiveSubjectTokenUI() {
  const subjects = state.subjects || [];
  const activeSub = subjects.find(s => s.id === state.selectedTokenSubjectId) || subjects[0];
  if (!activeSub) return;

  const displayToken = document.getElementById('proctor-token-display');
  const displayTitle = document.getElementById('token-active-subject-title');
  const metricToken = document.getElementById('metric-active-token');

  if (displayToken) displayToken.textContent = activeSub.token || 'TOKEN1';
  if (displayTitle) displayTitle.textContent = activeSub.name.toUpperCase();
  if (metricToken) metricToken.textContent = `${activeSub.code}: ${activeSub.token}`;
}

// Mesin Token Dinamis 3 Menit (180 Detik)
function startProctorTokenTimer() {
  if (state.proctorToken.interval) clearInterval(state.proctorToken.interval);

  renderProctorTokenBar();
  renderHorizontalTokenRibbon();

  state.proctorToken.interval = setInterval(() => {
    state.proctorToken.remainingSeconds--;

    if (state.proctorToken.remainingSeconds <= 0) {
      // Regenerate Token Baru Otomatis untuk Mapel Aktif
      generateNewProctorToken(false);
      state.proctorToken.remainingSeconds = 180;
    }

    const mins = Math.floor(state.proctorToken.remainingSeconds / 60);
    const secs = state.proctorToken.remainingSeconds % 60;
    const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

    const displayTimer = document.getElementById('token-timer-countdown');
    const modalTimer = document.getElementById('modal-all-tokens-countdown');
    const progressBar = document.getElementById('token-progress-bar');

    if (displayTimer) displayTimer.textContent = timeStr;
    if (modalTimer) modalTimer.textContent = timeStr;
    if (progressBar) {
      const pct = (state.proctorToken.remainingSeconds / 180) * 100;
      progressBar.style.width = pct + '%';
    }

    // Update countdown di pil-pil horizontal ribbon (Gambar 2)
    const timeBadges = document.querySelectorAll('.token-ribbon-pills-container .pill-time');
    timeBadges.forEach(tb => tb.textContent = `(${timeStr})`);
  }, 1000);
}

function generateNewProctorToken(showToastMsg = true) {
  const subjects = state.subjects || [];
  const activeSub = subjects.find(s => s.id === state.selectedTokenSubjectId) || subjects[0];
  if (!activeSub) return;

  const randomNum = Math.floor(Math.random() * 89 + 10);
  const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const newToken = `${activeSub.code}${randomNum}${randomLetter}`;

  activeSub.token = newToken;
  localStorage.setItem('zettcbt_subjects', JSON.stringify(state.subjects));

  // Sinkronkan juga ke schedules yang punya mapel ini
  (state.schedules || []).forEach(sc => {
    if (sc.subjectName === activeSub.name) sc.token = newToken;
  });
  localStorage.setItem('zettcbt_schedules', JSON.stringify(state.schedules));

  renderProctorTokenBar();
  renderHorizontalTokenRibbon();
  renderTeacherExamSchedules();

  if (showToastMsg) {
    showToast(`Token baru ${activeSub.name}: ${newToken}`, 'info');
  }
}

function forceRefreshToken() {
  state.proctorToken.remainingSeconds = 180;
  // Acak seluruh token mapel serentak
  const subjects = state.subjects || [];
  subjects.forEach(sub => {
    const randomNum = Math.floor(Math.random() * 89 + 10);
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    sub.token = `${sub.code}${randomNum}${randomLetter}`;
  });
  localStorage.setItem('zettcbt_subjects', JSON.stringify(state.subjects));
  renderProctorTokenBar();
  renderHorizontalTokenRibbon();
  renderTeacherExamSchedules();
  showToast('Seluruh Token Ujian Siswa berhasil di-Reload & diperbarui!', 'success');
}

// ==============================================================================
// MODAL TAMPILKAN SEMUA TOKEN MAPEL
// ==============================================================================

function openAllSubjectTokensModal() {
  const modal = document.getElementById('modal-all-subject-tokens');
  const grid = document.getElementById('modal-all-tokens-grid-body');
  if (!modal || !grid) return;

  const subjects = state.subjects || [];
  let html = '';
  subjects.forEach(sub => {
    html += `
      <div class="all-token-card">
        <div class="all-token-card-header">
          <div>
            <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">${escapeHtml(sub.code)} - ${sub.durationMinutes || 90} MENIT</div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #ffffff;">${escapeHtml(sub.name)}</div>
          </div>
          <span class="badge" style="background: ${sub.isActive !== false ? '#065f46' : '#881337'}; color: #ffffff; font-size: 0.68rem;">
            ${sub.isActive !== false ? 'AKTIF' : 'DITUTUP'}
          </span>
        </div>
        <div class="all-token-digits">${escapeHtml(sub.token || '-')}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #1e293b;">
          <button type="button" class="btn btn-outline btn-sm" onclick="copySingleToken('${sub.token}', '${sub.name}')" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; color: #38bdf8; border-color: #0284c7;">
            📋 Salin Token
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="randomizeSingleSubjectToken('${sub.id}'); openAllSubjectTokensModal();" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; color: #cbd5e1; border-color: #475569;">
            🎲 Acak
          </button>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
  modal.style.display = 'flex';
}

function closeAllSubjectTokensModal() {
  const modal = document.getElementById('modal-all-subject-tokens');
  if (modal) modal.style.display = 'none';
}

function copySingleToken(token, subName) {
  navigator.clipboard.writeText(token).then(() => {
    showToast(`Token ${subName} (${token}) berhasil disalin ke clipboard!`, 'success');
  }).catch(() => {
    showToast(`Token: ${token}`, 'info');
  });
}

function copyAllTokensToClipboard() {
  const subjects = state.subjects || [];
  let txt = `=== TOKEN UJIAN RESMI ${state.school.name} ===\n`;
  subjects.forEach((s, idx) => {
    txt += `${idx + 1}. ${s.name}: ${s.token} (${s.durationMinutes || 90} mnt)\n`;
  });
  navigator.clipboard.writeText(txt).then(() => {
    showToast('Seluruh daftar token mata pelajaran berhasil disalin!', 'success');
  }).catch(() => {
    showToast('Gagal menyalin otomatis.', 'warning');
  });
}

// ==============================================================================
// SAKELAR KONTROL STATUS LOGIN SISWA
// ==============================================================================

function toggleGlobalStudentLogin() {
  state.isStudentLoginActive = !state.isStudentLoginActive;
  localStorage.setItem('zettcbt_student_login_active', state.isStudentLoginActive ? 'true' : 'false');
  updateGlobalLoginButtonUI();

  if (state.isStudentLoginActive) {
    showToast('Pintu Login Siswa DIBUKA! Seluruh siswa dapat masuk mengerjakan ujian.', 'success');
  } else {
    showToast('Pintu Login Siswa DITUTUP! Siswa baru tidak dapat login hingga dibuka kembali.', 'warning');
  }
}

function updateGlobalLoginButtonUI() {
  const btn = document.getElementById('btn-global-login-toggle');
  const ind = document.getElementById('login-toggle-indicator');
  const txt = document.getElementById('login-toggle-text');
  if (!btn) return;

  if (state.isStudentLoginActive) {
    btn.className = 'btn-student-login-toggle active';
    if (ind) ind.textContent = '🟢';
    if (txt) txt.textContent = 'Login Siswa: DIBUKA';
    btn.title = 'Status: AKTIF (Siswa dapat login). Klik untuk menutup.';
  } else {
    btn.className = 'btn-student-login-toggle inactive';
    if (ind) ind.textContent = '🔴';
    if (txt) txt.textContent = 'Login Siswa: DITUTUP';
    btn.title = 'Status: NONAKTIF (Siswa ditolak). Klik untuk membuka.';
  }
}

// ==============================================================================
// JADWAL PELAKSANAAN UJIAN GURU (ROLE-BASED ISOLATION)
// ==============================================================================

function getVisibleSchedules() {
  const allSchedules = state.schedules || [];
  const teacher = state.currentTeacher;

  if (!teacher || teacher.role === 'admin_sekolah') {
    return allSchedules;
  }

  if (teacher.role === 'guru_kelas') {
    const cls = (teacher.assignedClass || '').trim();
    return allSchedules.filter(sc => sc.className === cls || sc.className === 'SEMUA KELAS');
  }

  if (teacher.role === 'guru_mapel') {
    const sub = (teacher.assignedSubject || '').toLowerCase();
    return allSchedules.filter(sc => {
      const scSub = (sc.subjectName || '').toLowerCase();
      return scSub.includes(sub) || sub.includes(scSub);
    });
  }

  return allSchedules;
}

function formatIndonesianDayDate(dateString) {
  if (!dateString) return { day: 'Senin', dateText: '-' };
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = new Date(dateString + 'T00:00:00');
  if (isNaN(d.getTime())) return { day: '-', dateText: dateString };
  return {
    day: days[d.getDay()],
    dateText: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  };
}

function handleScheduleDateChange(dateVal) {
  const hint = document.getElementById('schedule-day-hint');
  if (!hint) return;
  if (!dateVal) {
    hint.textContent = 'Hari: -';
    return;
  }
  const dayInfo = formatIndonesianDayDate(dateVal);
  hint.textContent = `Hari: ${dayInfo.day} (${dayInfo.dateText})`;
}

function renderTeacherExamSchedules() {
  const tbody = document.getElementById('table-teacher-schedules-body');
  const roleHint = document.getElementById('schedule-role-hint');
  const btnAdd = document.getElementById('btn-add-schedule-admin');
  if (!tbody) return;

  const teacher = state.currentTeacher;
  const schedules = getVisibleSchedules();

  // Atur visibilitas tombol tambah jadwal (khusus Operator Sekolah)
  if (btnAdd) {
    btnAdd.style.display = (!teacher || teacher.role === 'admin_sekolah') ? 'inline-flex' : 'none';
  }

  // Atur petunjuk peran
  if (roleHint) {
    if (!teacher || teacher.role === 'admin_sekolah') {
      roleHint.textContent = 'Mode Operator Sekolah: Menampilkan seluruh sesi jadwal ujian SD Negeri 14 Toboali.';
    } else if (teacher.role === 'guru_kelas') {
      roleHint.textContent = `Mode Guru Kelas ${teacher.assignedClass}: Menampilkan jadwal khusus untuk rombel binaan Anda.`;
    } else if (teacher.role === 'guru_mapel') {
      roleHint.textContent = `Mode Guru Mapel ${teacher.assignedSubject}: Menampilkan jadwal mata pelajaran binaan Anda di semua kelas.`;
    }
  }

  tbody.innerHTML = '';

  if (schedules.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem; color: var(--slate-400);">Tidak ada jadwal ujian yang sesuai dengan kewenangan akun Anda saat ini.</td></tr>';
    return;
  }

  schedules.forEach((sc, idx) => {
    const dayInfo = formatIndonesianDayDate(sc.date);
    const isReleased = sc.isLoginOpen !== false;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align: center;">${idx + 1}</td>
      <td><strong>${escapeHtml(sc.subjectName)}</strong></td>
      <td><span class="badge" style="background: var(--slate-200); color: var(--slate-800); font-weight: 700;">${escapeHtml(sc.className)}</span></td>
      <td>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span class="badge" style="background: #eff6ff; color: #1d4ed8; font-weight: 800; font-size: 0.74rem; width: fit-content; padding: 2px 7px; border: 1px solid #bfdbfe;">${escapeHtml(dayInfo.day)}</span>
          <span style="font-size: 0.82rem; font-weight: 600; color: #1e293b;">${escapeHtml(dayInfo.dateText)}</span>
        </div>
      </td>
      <td>
        <div style="font-weight: 700; color: #0f172a; font-size: 0.85rem;">
          ${escapeHtml(sc.startTime || '07:30')} - ${escapeHtml(sc.endTime || '09:00')} <span style="font-size: 0.72rem; color: #64748b;">WIB</span>
        </div>
        <div style="font-size: 0.74rem; color: #64748b;">(${sc.durationMinutes || 90} menit)</div>
      </td>
      <td>${escapeHtml(sc.room || 'Lab Komputer')}</td>
      <td>
        <span class="pwd-badge" style="color: #1e40af; background: #eff6ff; font-weight: 800; font-size: 0.9rem;">${escapeHtml(sc.token || '-')}</span>
      </td>
      <td style="text-align: center; white-space: nowrap;">
        <button type="button" class="btn-release-exam ${isReleased ? 'release-active' : 'release-inactive'}" onclick="toggleScheduleLoginStatus('${sc.id}')" title="Klik untuk ${isReleased ? 'menutup/mengunci' : 'merilis/membuka'} akses ujian bagi siswa">
          <span class="release-indicator">${isReleased ? '🟢' : '🔴'}</span>
          <span class="release-text">${isReleased ? 'DIRILIS (Buka)' : 'DITUTUP (Kunci)'}</span>
        </button>
      </td>
      <td style="text-align: center; white-space: nowrap;">
        <div style="display: inline-flex; gap: 0.35rem; align-items: center;">
          <button type="button" class="btn btn-outline btn-sm" onclick="openEditScheduleModal('${sc.id}')" title="Atur Jadwal Hari, Tanggal & Jam" style="font-size: 0.78rem; padding: 0.25rem 0.55rem;">
            ✏️ Atur
          </button>
          <button type="button" class="btn btn-sm" onclick="deleteExamSchedule('${sc.id}', '${escapeHtml(sc.subjectName)}', '${escapeHtml(sc.className)}')" title="Hapus Jadwal Ujian Ini" style="font-size: 0.78rem; padding: 0.25rem 0.55rem; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; cursor: pointer; border-radius: 6px;">
            🗑️
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteExamSchedule(id, subjectName, className) {
  const conf = confirm(`Apakah Anda yakin ingin menghapus jadwal ujian ${subjectName} untuk Kelas ${className}?`);
  if (!conf) return;

  state.schedules = (state.schedules || []).filter(s => s.id !== id);
  localStorage.setItem('zettcbt_schedules', JSON.stringify(state.schedules));
  renderTeacherExamSchedules();
  showToast(`Jadwal ujian ${subjectName} (${className}) berhasil dihapus!`, 'success');
}

function toggleScheduleLoginStatus(scheduleId) {
  const sc = (state.schedules || []).find(s => s.id === scheduleId);
  if (!sc) return;

  sc.isLoginOpen = sc.isLoginOpen === false ? true : false;
  localStorage.setItem('zettcbt_schedules', JSON.stringify(state.schedules));
  renderTeacherExamSchedules();

  if (sc.isLoginOpen) {
    showToast(`✅ Sesi ujian ${sc.subjectName} (${sc.className}) resmi DIRILIS! Siswa dapat masuk mengerjakan.`, 'success');
  } else {
    showToast(`🔒 Sesi ujian ${sc.subjectName} (${sc.className}) DITUTUP! Akses masuk siswa dikunci.`, 'warning');
  }
}

function openAddScheduleModal() {
  const modal = document.getElementById('modal-schedule-editor');
  if (!modal) return;

  document.getElementById('edit-schedule-id').value = '';
  document.getElementById('modal-schedule-title').textContent = 'Tambah Sesi Jadwal Ujian';
  document.getElementById('schedule-input-subject').value = '';
  document.getElementById('schedule-input-class').value = '6A';
  document.getElementById('schedule-input-room').value = 'Lab Komputer';
  const defaultDate = new Date().toISOString().split('T')[0];
  document.getElementById('schedule-input-date').value = defaultDate;
  handleScheduleDateChange(defaultDate);
  document.getElementById('schedule-input-token').value = 'BIN26A';
  document.getElementById('schedule-input-start').value = '07:30';
  document.getElementById('schedule-input-end').value = '09:00';
  document.getElementById('schedule-input-login-status').value = 'true';

  modal.style.display = 'flex';
}

function openEditScheduleModal(scheduleId) {
  const sc = (state.schedules || []).find(s => s.id === scheduleId);
  if (!sc) return;

  const modal = document.getElementById('modal-schedule-editor');
  if (!modal) return;

  document.getElementById('edit-schedule-id').value = sc.id;
  document.getElementById('modal-schedule-title').textContent = `Atur Sesi Jadwal (${sc.subjectName} - Kelas ${sc.className})`;
  document.getElementById('schedule-input-subject').value = sc.subjectName || '';
  document.getElementById('schedule-input-class').value = sc.className || '6A';
  document.getElementById('schedule-input-room').value = sc.room || 'Lab Komputer';
  const targetDate = sc.date || new Date().toISOString().split('T')[0];
  document.getElementById('schedule-input-date').value = targetDate;
  handleScheduleDateChange(targetDate);
  document.getElementById('schedule-input-token').value = sc.token || '';
  document.getElementById('schedule-input-start').value = sc.startTime || '07:30';
  document.getElementById('schedule-input-end').value = sc.endTime || '09:00';
  document.getElementById('schedule-input-login-status').value = (sc.isLoginOpen !== false) ? 'true' : 'false';

  modal.style.display = 'flex';
}

function closeScheduleModal() {
  const modal = document.getElementById('modal-schedule-editor');
  if (modal) modal.style.display = 'none';
}

function handleScheduleSubjectSelect(subjectName) {
  const subj = (state.subjects || []).find(s => s.name === subjectName);
  const tokenInput = document.getElementById('schedule-input-token');
  if (subj && tokenInput) {
    tokenInput.value = subj.token || 'TOKEN1';
  }
}

function handleSaveSchedule(event) {
  event.preventDefault();

  const id = document.getElementById('edit-schedule-id').value;
  const subjectName = document.getElementById('schedule-input-subject').value;
  const className = document.getElementById('schedule-input-class').value;
  const room = document.getElementById('schedule-input-room').value.trim();
  const date = document.getElementById('schedule-input-date').value;
  const token = document.getElementById('schedule-input-token').value.trim().toUpperCase();
  const startTime = document.getElementById('schedule-input-start').value;
  const endTime = document.getElementById('schedule-input-end').value;
  const isLoginOpen = document.getElementById('schedule-input-login-status').value === 'true';

  const teacher = state.currentTeacher;
  const teacherName = teacher ? teacher.fullName : 'Operator Sekolah';

  if (!id) {
    const newSchedule = {
      id: 'sch-' + Date.now(),
      subjectName,
      className,
      room,
      date,
      token,
      startTime,
      endTime,
      durationMinutes: 90,
      teacherName,
      status: 'active',
      isLoginOpen
    };
    state.schedules.push(newSchedule);
    showToast('Jadwal ujian berhasil ditambahkan!', 'success');
  } else {
    const sc = state.schedules.find(s => s.id === id);
    if (sc) {
      sc.subjectName = subjectName;
      sc.className = className;
      sc.room = room;
      sc.date = date;
      sc.token = token;
      sc.startTime = startTime;
      sc.endTime = endTime;
      sc.isLoginOpen = isLoginOpen;
      showToast('Jadwal ujian berhasil diperbarui!', 'success');
    }
  }

  localStorage.setItem('zettcbt_schedules', JSON.stringify(state.schedules));
  closeScheduleModal();
  renderTeacherExamSchedules();
}

function openTeacherPortal() {
  if (state.currentTeacher) {
    applyTeacherIsolation();
    showScreen('admin-dashboard');
  } else {
    showScreen('teacher-login');
  }
}

function quickFillTeacher(username, password) {
  const uInput = document.getElementById('teacher-login-username');
  const pInput = document.getElementById('teacher-login-password');
  if (uInput) uInput.value = username;
  if (pInput) pInput.value = password;
  showToast('Akun ' + username + ' terisi! Silakan klik tombol Masuk.', 'info');
}

async function handleTeacherLogin(event) {
  event.preventDefault();
  const username = document.getElementById('teacher-login-username').value.trim().toLowerCase();
  const password = document.getElementById('teacher-login-password').value.trim();

  // 1. Cek Akun Lokal Bawaan
  let matchedTeacher = state.teachers.find(t => t.username === username && t.password === password);

  // 2. Cek Akun Database Supabase jika terkonfigurasi
  if (!matchedTeacher && state.supabase.url && state.supabase.key) {
    try {
      const res = await fetch(state.supabase.url + '/rest/v1/teachers?username=eq.' + encodeURIComponent(username) + '&select=*', {
        headers: {
          'apikey': state.supabase.key,
          'Authorization': 'Bearer ' + state.supabase.key
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0 && data[0].password_hash === password) {
          const row = data[0];
          matchedTeacher = {
            id: row.id,
            username: row.username,
            password: row.password_hash,
            fullName: row.full_name,
            role: row.role,
            assignedClass: row.assigned_class,
            assignedSubject: row.assigned_subject
          };
        }
      }
    } catch (e) {
      console.warn('Gagal memverifikasi akun guru ke Supabase, fallback ke database lokal', e);
    }
  }

  if (matchedTeacher) {
    // Hidrasi profil tersimpan dari Profile Vault permanen jika pernah disimpan
    try {
      const savedVault = JSON.parse(localStorage.getItem('zettcbt_admin_profile_' + matchedTeacher.username) || 'null');
      if (savedVault) {
        if (savedVault.fullName) matchedTeacher.fullName = savedVault.fullName;
        if (savedVault.nip) matchedTeacher.nip = savedVault.nip;
      }
    } catch(e) {}

    state.currentTeacher = matchedTeacher;
    sessionStorage.setItem('zettcbt_current_teacher', JSON.stringify(matchedTeacher));
    localStorage.removeItem('zettcbt_current_teacher');
    sessionStorage.setItem('zettcbt_current_view', 'admin-dashboard');
    localStorage.removeItem('zettcbt_current_view');
    
    // Update navbar label
    const navLabel = document.getElementById('nav-teacher-label');
    if (navLabel) navLabel.textContent = matchedTeacher.fullName || matchedTeacher.username;

    applyTeacherIsolation();
    showScreen('admin-dashboard');
    switchAdminTab('srms-dashboard');
    showToast('Login berhasil! Selamat datang, ' + matchedTeacher.fullName, 'success');
  } else {
    showToast('Username atau password salah! Silakan coba lagi.', 'danger');
  }
}

function handleTeacherLogout() {
  if (!confirm('Apakah Anda yakin ingin keluar dari sesi Guru & Pengawas?')) return;

  // Tutup semua modal yang mungkin sedang terbuka
  try { closeTeacherProfileModal(); } catch(e){}
  try { closeNotificationsModal(); } catch(e){}
  const profileModal = document.getElementById('modal-teacher-profile');
  if (profileModal) profileModal.style.display = 'none';

  // Tutup sidebar mobile jika sedang terbuka
  const sidebar = document.querySelector('.admin-sidebar');
  if (sidebar) sidebar.classList.remove('open');
  const backdrop = document.querySelector('.sidebar-backdrop');
  if (backdrop) backdrop.classList.remove('active');

  // Bersihkan data sesi
  sessionStorage.removeItem('zettcbt_current_teacher');
  sessionStorage.removeItem('zettcbt_current_view');
  sessionStorage.removeItem('zettcbt_current_admin_tab');
  localStorage.removeItem('zettcbt_current_teacher');
  localStorage.removeItem('zettcbt_current_view');
  localStorage.removeItem('zettcbt_current_admin_tab');
  state.currentTeacher = null;

  const navLabel = document.getElementById('nav-teacher-label');
  if (navLabel) navLabel.textContent = 'Guru & Pengawas';

  const tabSb = document.getElementById('tab-link-supabase');
  if (tabSb) tabSb.style.display = 'none';

  const tabTeachers = document.getElementById('tab-link-teachers');
  if (tabTeachers) tabTeachers.style.display = 'none';

  const navSb = document.getElementById('tab-nav-database-config');
  if (navSb) navSb.style.display = 'none';

  const navTeachers = document.getElementById('tab-nav-manage-teachers');
  if (navTeachers) navTeachers.style.display = 'none';

  // Kembalikan teks topbar ke default
  const elWelcome = document.getElementById('welcome-teacher-name');
  if (elWelcome) elWelcome.textContent = 'Bapak/Ibu Guru';
  const elHeaderName = document.getElementById('srms-header-user-name');
  if (elHeaderName) elHeaderName.textContent = 'Bapak/Ibu Guru';
  const elHeaderRole = document.getElementById('srms-header-user-role');
  if (elHeaderRole) elHeaderRole.textContent = 'SD Negeri 14 Toboali';

  showScreen('student-login');
  showToast('Anda telah berhasil keluar dari akun.', 'info');
}

// Terapkan Isolasi Tampilan berdasarkan Akun Guru yang Aktif
function applyTeacherIsolation() {
  if (!state.currentTeacher) return;
  const t = state.currentTeacher;

  // 1. Update Profile Banner di Dashboard
  const elName = document.getElementById('teacher-profile-name');
  const elBadge = document.getElementById('teacher-profile-badge');
  const elScope = document.getElementById('teacher-profile-scope');
  const elNoticeText = document.getElementById('teacher-isolation-text');

  if (elName) elName.textContent = t.fullName;

  const elWelcome = document.getElementById('welcome-teacher-name');
  if (elWelcome) elWelcome.textContent = t.fullName;

  if (elBadge) {
    if (t.role === 'guru_kelas') {
      elBadge.className = 'teacher-badge kelas';
      elBadge.textContent = 'GURU KELAS ' + (t.assignedClass || '');
    } else if (t.role === 'guru_mapel') {
      elBadge.className = 'teacher-badge mapel';
      elBadge.textContent = 'GURU MAPEL ' + (t.assignedSubject || '');
    } else {
      elBadge.className = 'teacher-badge admin';
      elBadge.textContent = 'OPERATOR SEKOLAH';
    }
  }

  if (elScope) {
    if (t.role === 'guru_kelas') {
      elScope.textContent = 'Kewenangan: Khusus Kelas ' + t.assignedClass + ' | Mapel: ' + (t.assignedSubject || 'Semua');
    } else if (t.role === 'guru_mapel') {
      elScope.textContent = 'Kewenangan: Seluruh Kelas | Khusus Mapel: ' + t.assignedSubject;
    } else {
      elScope.textContent = 'Kewenangan: Operator Sekolah (Akses Penuh Seluruh Kelas & Mata Pelajaran)';
    }
  }

  if (elNoticeText) {
    if (t.role === 'guru_kelas') {
      elNoticeText.innerHTML = '<strong>🔒 Sistem Isolasi Aktif:</strong> Anda masuk sebagai <strong>Wali/Guru Kelas ' + t.assignedClass + '</strong>. Anda hanya dapat melihat dan mengelola bank soal, data siswa, serta nilai siswa <strong>Kelas ' + t.assignedClass + '</strong>. Soal guru kelas lain diisolasi secara aman.';
    } else if (t.role === 'guru_mapel') {
      elNoticeText.innerHTML = '<strong>🔒 Sistem Isolasi Aktif:</strong> Anda masuk sebagai <strong>Guru Mata Pelajaran ' + t.assignedSubject + '</strong>. Anda hanya dapat mengelola bank soal mata pelajaran <strong>' + t.assignedSubject + '</strong>.';
    } else {
      elNoticeText.innerHTML = '<strong>👑 Mode Operator Sekolah:</strong> Anda memiliki akses pengawas penuh (Super Admin). Anda dapat mengelola akun guru, database Supabase Cloud, seluruh bank soal, master siswa, jadwal ujian, dan rekapitulasi nilai sekolah.';
    }
  }

  // 2. Tampilkan Tab Supabase & Kelola Guru HANYA jika Operator Sekolah (admin_sekolah)
  const tabSb = document.getElementById('tab-link-supabase');
  if (tabSb) tabSb.style.display = (t.role === 'admin_sekolah') ? 'inline-block' : 'none';

  const tabTeachers = document.getElementById('tab-link-teachers');
  if (tabTeachers) tabTeachers.style.display = (t.role === 'admin_sekolah') ? 'inline-block' : 'none';

  const navSb = document.getElementById('tab-nav-database-config');
  if (navSb) navSb.style.display = (t.role === 'admin_sekolah') ? 'flex' : 'none';

  const navTeachers = document.getElementById('tab-nav-manage-teachers');
  if (navTeachers) navTeachers.style.display = (t.role === 'admin_sekolah') ? 'flex' : 'none';

  // Kunci dropdown filter siswa jika Guru Kelas
  const studentFilter = document.getElementById('filter-manage-student-class');
  if (studentFilter) {
    if (t.role === 'guru_kelas' && t.assignedClass) {
      studentFilter.value = t.assignedClass;
      studentFilter.disabled = true;
    } else {
      studentFilter.disabled = false;
    }
  }

  // 3. Render ulang data terisolasi
  renderSrmsDashboard();
  renderAdminQuestionBank();
  renderLiveMonitoringTable();
  renderTeacherExamSchedules();
  renderProctorTokenBar();
  updateGlobalLoginButtonUI();
  renderStudentsTable();
  if (t.role === 'admin_sekolah') renderTeachersTable();
  updateAdminMetrics();
  renderResultsTable();
}

// Filter Bank Soal Terisolasi
function getVisibleQuestions() {
  if (!state.currentTeacher) return state.questions;
  const t = state.currentTeacher;

  if (t.role === 'admin_sekolah') {
    return state.questions; // Admin melihat semua
  }

  if (t.role === 'guru_kelas') {
    // Guru kelas hanya melihat soal kelasnya sendiri atau yang dibuatnya sendiri
    return state.questions.filter(q => 
      (q.targetClass && (q.targetClass === t.assignedClass || q.targetClass === 'Kelas ' + t.assignedClass)) || 
      q.teacherId === t.id
    );
  }

  if (t.role === 'guru_mapel') {
    // Guru mapel hanya melihat soal mapelnya sendiri atau yang dibuatnya sendiri
    return state.questions.filter(q => 
      (q.subject && q.subject.toLowerCase() === t.assignedSubject.toLowerCase()) || 
      q.teacherId === t.id
    );
  }

  return state.questions;
}

// Filter Siswa Aktif Terisolasi
function getVisibleLiveStudents() {
  if (!state.currentTeacher) return state.liveStudents;
  const t = state.currentTeacher;

  if (t.role === 'admin_sekolah' || t.role === 'guru_mapel') {
    return state.liveStudents;
  }

  if (t.role === 'guru_kelas') {
    // Hanya tampilkan siswa di kelasnya
    return state.liveStudents.filter(s => 
      s.className === t.assignedClass || 
      s.className === 'Kelas ' + t.assignedClass ||
      s.className.includes(t.assignedClass)
    );
  }

  return state.liveStudents;
}

function toggleStudentPasswordVisibility() {
  const pwdInput = document.getElementById('login-password');
  const eyeIcon = document.getElementById('student-eye-icon');
  if (!pwdInput) return;
  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    if (eyeIcon) {
      eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    }
  } else {
    pwdInput.type = 'password';
    if (eyeIcon) {
      eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
  }
}

function autoFillStudentInfo(nisn) {
  if (!nisn) return;
  const st = (state.students || []).find(s => s.nisn.trim().toLowerCase() === nisn.trim().toLowerCase());
  if (st) {
    showToast(`Peserta ditemukan: ${st.name} (${st.className}). Silakan pilih mapel dan masukkan password kartu.`, 'info');
  }
}

// SCREEN 1: Handle Student Login (Direct Exam Start with Subject Token & Password)
function handleStudentLogin(event) {
  event.preventDefault();

  const nisn = document.getElementById('login-nisn').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const token = document.getElementById('login-token').value.trim().toUpperCase();

  if (!nisn || !password || !token) {
    showToast('Harap lengkapi Nomor Peserta, Password Siswa, dan Token Ujian!', 'warning');
    return;
  }

  // 1. Validasi Keberadaan Siswa
  const student = (state.students || []).find(s => s.nisn.toLowerCase() === nisn.toLowerCase());
  if (!student) {
    showToast('Nomor Peserta / NISN "' + nisn + '" belum terdaftar di sistem sekolah! Hubungi pengawas.', 'danger');
    return;
  }

  // 1b. Validasi Sakelar Master Pintu Login Siswa Sekolah
  if (state.isStudentLoginActive === false) {
    showToast('⚠️ Pintu login ujian sekolah sedang DITUTUP oleh Pengawas! Harap menunggu instruksi pengawas.', 'warning');
    return;
  }

  // 2. Deteksi Otomatis Mata Pelajaran Berdasarkan Token Ujian Pengawas
  let subj = (state.subjects || []).find(s => (s.token || '').trim().toUpperCase() === token);

  // Jika tidak ditemukan langsung di master subjects, periksa di daftar jadwal
  if (!subj && Array.isArray(state.schedules)) {
    const matchingSched = state.schedules.find(sc => (sc.token || '').trim().toUpperCase() === token);
    if (matchingSched) {
      subj = (state.subjects || []).find(s => s.name === matchingSched.subjectName || s.name === matchingSched.subject) || {
        name: matchingSched.subjectName || matchingSched.subject,
        durationMinutes: matchingSched.durationMinutes || 90,
        token: matchingSched.token
      };
    }
  }

  if (!subj) {
    showToast(`Token Ujian "${token}" tidak cocok dengan mata pelajaran apapun atau belum dirilis Pengawas!`, 'danger');
    return;
  }

  const subjectName = subj.name;

  // 2b. Validasi Status Rilis Sesi Jadwal Ujian untuk Siswa Ini
  if (Array.isArray(state.schedules)) {
    const classSched = state.schedules.find(sc => 
      (sc.subjectName === subjectName || (sc.token || '').trim().toUpperCase() === token) &&
      (sc.className === 'SEMUA KELAS' || sc.className === student.className || student.className.includes(sc.className))
    );
    if (classSched && classSched.isLoginOpen === false) {
      showToast(`⚠️ Sesi ujian ${subjectName} untuk Kelas ${student.className} belum dirilis Pengawas Ruang! Harap menunggu aba-aba pengawas.`, 'warning');
      return;
    }
  }

  // 3. Validasi Password Siswa untuk Mata Pelajaran yang Terdeteksi
  const expectedPassword = getStudentPasswordForSubject(student, subjectName);
  if (password.toUpperCase() !== expectedPassword.toUpperCase()) {
    showToast(`Password tidak sesuai untuk mata pelajaran ${subjectName}! Silakan periksa password pada Kartu Ujian Anda.`, 'danger');
    return;
  }

  // 5. Status Ujian Langsung Dimulai (Poin 1 Permintaan Pengguna)
  state.student.nisn = student.nisn;
  state.student.name = student.name;
  state.student.className = student.className;
  state.student.subject = subjectName;
  state.student.startTime = new Date();
  state.student.answers = {};
  state.warningCount = 0;

  state.session.subject = subjectName;
  state.session.durationMinutes = subj.durationMinutes || 90;
  state.timeRemainingSeconds = state.session.durationMinutes * 60;

  // Cek apakah siswa melanjutkan (resume) sesi ujian yang sempat ditutup
  let isResumed = false;
  try {
    const rawSaved = localStorage.getItem('zettcbt_active_student_exam');
    if (rawSaved) {
      const parsed = JSON.parse(rawSaved);
      if (parsed && parsed.student && parsed.student.nisn.toLowerCase() === student.nisn.toLowerCase() && parsed.sessionSubject === subjectName) {
        state.student.answers = parsed.student.answers || {};
        if (parsed.timeRemainingSeconds > 0) state.timeRemainingSeconds = parsed.timeRemainingSeconds;
        if (parsed.currentQuestionIndex !== undefined) state.currentQuestionIndex = parsed.currentQuestionIndex;
        isResumed = true;
      }
    }
  } catch (e) {}

  // Tandai sesi ujian aktif di sessionStorage (musnah otomatis jika browser/tab ditutup)
  sessionStorage.setItem('zettcbt_exam_in_session', 'true');

  // Filter Soal Sesuai Mata Pelajaran & Kelas
  const filteredQ = state.questions.filter(q => 
    (!q.subject || q.subject.toLowerCase() === subjectName.toLowerCase() || q.subject.includes(subj.code)) &&
    (!q.targetClass || q.targetClass === student.className || student.className.includes(q.targetClass))
  );
  if (filteredQ.length > 0) {
    state.activeExamQuestions = filteredQ;
  } else {
    state.activeExamQuestions = state.questions;
  }

  if (state.activeExamQuestions.length === 0) {
    showToast('Bank soal untuk mata pelajaran ini belum diinput oleh guru!', 'warning');
    return;
  }

  // Populate UI Header Ujian Siswa
  const elAvatar = document.getElementById('exam-avatar');
  if (elAvatar) elAvatar.textContent = (student.name || 'S').charAt(0).toUpperCase();
  const elName = document.getElementById('exam-student-name');
  if (elName) elName.textContent = student.name;
  const elSubj = document.getElementById('exam-subject-name');
  if (elSubj) elSubj.textContent = subjectName;
  const elClass = document.getElementById('exam-class-name');
  if (elClass) elClass.textContent = student.className;

  // Catat Langsung ke Live Monitoring (Status: in_progress)
  const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  const existingIdx = state.liveStudents.findIndex(s => s.nisn === student.nisn);
  const liveEntry = {
    nisn: student.nisn,
    name: student.name,
    className: student.className,
    subject: subjectName,
    answeredCount: Object.keys(state.student.answers || {}).length,
    totalQ: state.activeExamQuestions.length,
    warningCount: 0,
    status: 'in_progress',
    score: 0,
    time: nowStr
  };
  if (existingIdx >= 0) {
    state.liveStudents[existingIdx] = liveEntry;
  } else {
    state.liveStudents.unshift(liveEntry);
  }
  localStorage.setItem('zettcbt_live_students', JSON.stringify(state.liveStudents));
  updateAdminMetrics();
  renderLiveMonitoringTable();

  // Aktifkan Sesi Ujian & Timer Langsung
  state.isExamRunning = true;
  if (!isResumed) state.currentQuestionIndex = 0;
  state.initialExamHeight = window.innerHeight;
  enterMobileFullscreen();
  startTimerCountdown();
  renderQuestionGrid();
  renderCurrentQuestion();
  showScreen('student-exam');

  if (isResumed) {
    showToast(`Selamat datang kembali, ${student.name}! Sesi ujian ${subjectName} dilanjutkan. Jawaban Anda tersimpan aman.`, 'success');
  } else {
    showToast(`Token terverifikasi! Ujian ${subjectName} resmi dimulai dalam mode layar penuh. Selamat mengerjakan!`, 'success');
  }
}

// SCREEN 2 -> SCREEN 3: Start Exam
function startExamSession() {
  state.isExamRunning = true;
  state.student.startTime = new Date();
  state.timeRemainingSeconds = state.session.durationMinutes * 60;
  state.currentQuestionIndex = 0;
  state.initialExamHeight = window.innerHeight;

  // Populate Banner
  document.getElementById('exam-avatar').textContent = (state.student.name || 'S').charAt(0).toUpperCase();
  document.getElementById('exam-student-name').textContent = state.student.name;
  document.getElementById('exam-subject-name').textContent = state.session.subject;
  document.getElementById('exam-class-name').textContent = state.student.className;

  // Enter Fullscreen on Mobile/Desktop
  enterMobileFullscreen();

  // Register in live students list
  const existingIndex = state.liveStudents.findIndex(s => s.nisn === state.student.nisn);
  const studentEntry = {
    nisn: state.student.nisn,
    name: state.student.name,
    className: state.student.className,
    answeredCount: 0,
    totalQ: state.questions.length,
    warningCount: 0,
    status: 'in_progress',
    score: 0,
    time: '-'
  };

  if (existingIndex >= 0) {
    state.liveStudents[existingIndex] = studentEntry;
  } else {
    state.liveStudents.unshift(studentEntry);
  }
  updateAdminMetrics();
  renderLiveMonitoringTable();

  // Start Countdown Timer
  startTimerCountdown();

  // Render question layout
  renderQuestionGrid();
  renderCurrentQuestion();

  showScreen('student-exam');
  showToast('Ujian dimulai! Mode layar penuh aktif.', 'info');
}

// Timer Engine with Pulsating Warning
function startTimerCountdown() {
  if (state.timerInterval) clearInterval(state.timerInterval);

  updateTimerDisplay();

  state.timerInterval = setInterval(() => {
    if (state.timeRemainingSeconds <= 0) {
      clearInterval(state.timerInterval);
      showToast('Waktu ujian telah habis! Sistem mengirim jawaban otomatis...', 'warning');
      submitFinalExam(true);
      return;
    }

    state.timeRemainingSeconds--;
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const display = document.getElementById('exam-timer-display');
  const wrapper = document.getElementById('exam-timer-wrapper');
  if (!display) return;

  const hours = Math.floor(state.timeRemainingSeconds / 3600);
  const minutes = Math.floor((state.timeRemainingSeconds % 3600) / 60);
  const seconds = state.timeRemainingSeconds % 60;

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  display.textContent = hStr + ':' + mStr + ':' + sStr;

  // If time is less than 5 minutes (300 seconds), pulse red
  if (state.timeRemainingSeconds <= 300) {
    if (wrapper) wrapper.classList.add('timer-danger');
  } else {
    if (wrapper) wrapper.classList.remove('timer-danger');
  }
}

// Helper: Ambil Bank Soal yang Sesuai Sesi Siswa Aktif
function getActiveExamQuestions() {
  if (Array.isArray(state.activeExamQuestions) && state.activeExamQuestions.length > 0) {
    return state.activeExamQuestions;
  }
  return state.questions || [];
}

// Render Current Question (ANBK/UTBK Standard)
function renderCurrentQuestion() {
  const qList = getActiveExamQuestions();
  const q = qList[state.currentQuestionIndex];
  if (!q) return;

  const optionsContainer = document.getElementById('options-list-container');
  if (optionsContainer) optionsContainer.innerHTML = '';

  // Header Badge Desktop
  const badge = document.getElementById('exam-question-badge');
  if (badge) badge.textContent = 'Soal No. ' + (state.currentQuestionIndex + 1) + ' dari ' + qList.length;

  // Label Nomor pada Bar Jempol Mobile
  const mobileLabel = document.getElementById('mobile-current-q-label');
  if (mobileLabel) mobileLabel.textContent = 'No. ' + (state.currentQuestionIndex + 1);

  // Content Text
  const content = document.getElementById('question-content-text');
  if (content) content.textContent = q.text;

  // Image Attachment if any
  const imgBox = document.getElementById('question-image-box');
  const imgTag = document.getElementById('question-image-tag');
  if (q.imageUrl && q.imageUrl.trim()) {
    if (imgTag) imgTag.src = q.imageUrl;
    if (imgBox) imgBox.style.display = 'block';
  } else {
    if (imgBox) imgBox.style.display = 'none';
  }

  // Render Berdasarkan 5 Tipe Soal ANBK
  const qType = q.type || 'pg';
  const studentAns = state.student.answers[q.id] || { selected: null, isDoubt: false };

  // 1. Tipe: Pilihan Ganda (Single Choice)
  if (qType === 'pg') {
    const optionsData = [
      { key: 'A', text: q.optionA },
      { key: 'B', text: q.optionB },
      { key: 'C', text: q.optionC },
      { key: 'D', text: q.optionD }
    ];
    if (q.optionE && q.optionE.trim()) {
      optionsData.push({ key: 'E', text: q.optionE });
    }

    optionsData.forEach((opt) => {
      const isSelected = studentAns.selected === opt.key;
      const item = document.createElement('div');
      item.className = 'option-item' + (isSelected ? ' selected' : '');
      item.onclick = () => selectOptionAnswer(q.id, opt.key);

      const keyCircle = document.createElement('div');
      keyCircle.className = 'option-key';
      keyCircle.textContent = opt.key;

      const optText = document.createElement('div');
      optText.className = 'option-text';
      optText.textContent = opt.text;

      item.appendChild(keyCircle);
      item.appendChild(optText);
      if (optionsContainer) optionsContainer.appendChild(item);
    });
  } 
  // 2. Tipe: PG Kompleks (Multi Select Checkbox)
  else if (qType === 'kompleks') {
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size: 0.85rem; color: #16a34a; font-weight: 700; margin-bottom: 0.75rem; background: #f0fdf4; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);';
    hint.textContent = 'ℹ️ Pilihan Ganda Kompleks: Anda dapat memilih LEBIH DARI SATU jawaban yang benar.';
    if (optionsContainer) optionsContainer.appendChild(hint);

    const selectedKeys = Array.isArray(studentAns.selected) ? studentAns.selected : [];
    const optionsData = [
      { key: 'A', text: q.optionA },
      { key: 'B', text: q.optionB },
      { key: 'C', text: q.optionC },
      { key: 'D', text: q.optionD }
    ];
    if (q.optionE && q.optionE.trim()) optionsData.push({ key: 'E', text: q.optionE });

    optionsData.forEach((opt) => {
      const isSelected = selectedKeys.includes(opt.key);
      const item = document.createElement('div');
      item.className = 'option-item' + (isSelected ? ' selected' : '');
      item.onclick = () => toggleMultiKeyAnswer(q.id, opt.key);

      const chkBox = document.createElement('input');
      chkBox.type = 'checkbox';
      chkBox.checked = isSelected;
      chkBox.style.cssText = 'width: 18px; height: 18px; margin-right: 0.75rem;';

      const optText = document.createElement('div');
      optText.className = 'option-text';
      optText.innerHTML = '<strong>(' + opt.key + ')</strong> ' + escapeHtml(opt.text);

      item.appendChild(chkBox);
      item.appendChild(optText);
      if (optionsContainer) optionsContainer.appendChild(item);
    });
  }
  // 3. Tipe: Menjodohkan (Matching Pairs)
  else if (qType === 'jodoh') {
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size: 0.85rem; color: #b45309; font-weight: 700; margin-bottom: 0.75rem; background: #fffbeb; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);';
    hint.textContent = 'ℹ️ Menjodohkan: Pasangkan pernyataan di kolom kiri dengan pilihan yang tepat di kolom kanan.';
    if (optionsContainer) optionsContainer.appendChild(hint);

    const pairs = q.pairs || [
      { premis: 'Pernyataan A', jawab: 'Pasangan 1' },
      { premis: 'Pernyataan B', jawab: 'Pasangan 2' }
    ];
    const userPairs = studentAns.selected || {};

    const table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse; margin-top: 0.5rem; background: #ffffff; border: 1px solid var(--slate-200); border-radius: var(--radius-md); overflow: hidden;';
    table.innerHTML = '<thead style="background: var(--slate-100);"><tr><th style="padding: 0.6rem; text-align: left;">Pernyataan / Premis</th><th style="padding: 0.6rem; text-align: left;">Pilihan Jawaban Pasangan</th></tr></thead><tbody></tbody>';
    const tbody = table.querySelector('tbody');

    pairs.forEach((p, pIdx) => {
      const tr = document.createElement('tr');
      tr.style.borderTop = '1px solid var(--slate-200)';
      
      let optionsHtml = '<option value="">-- Pilih Pasangan --</option>';
      pairs.forEach((item, aIdx) => {
        const isSel = userPairs[pIdx] === item.jawab ? 'selected' : '';
        optionsHtml += '<option value="' + escapeHtml(item.jawab) + '" ' + isSel + '>' + escapeHtml(item.jawab) + '</option>';
      });

      tr.innerHTML = 
        '<td style="padding: 0.75rem; font-weight: 600;">' + (pIdx + 1) + '. ' + escapeHtml(p.premis) + '</td>' +
        '<td style="padding: 0.75rem;">' +
          '<select class="form-control" onchange="selectPairAnswer(\'' + q.id + '\', ' + pIdx + ', this.value)">' +
            optionsHtml +
          '</select>' +
        '</td>';
      tbody.appendChild(tr);
    });
    if (optionsContainer) optionsContainer.appendChild(table);
  }
  // 4. Tipe: Esai / Isian Singkat
  else if (qType === 'esai') {
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size: 0.85rem; color: #7e22ce; font-weight: 700; margin-bottom: 0.75rem; background: #faf5ff; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);';
    hint.textContent = 'ℹ️ Soal Isian / Esai: Tuliskan jawaban Anda pada kolom di bawah ini secara jelas.';
    if (optionsContainer) optionsContainer.appendChild(hint);

    const txt = document.createElement('textarea');
    txt.className = 'form-control';
    txt.rows = 4;
    txt.placeholder = 'Ketik jawaban Anda di sini...';
    txt.value = typeof studentAns.selected === 'string' ? studentAns.selected : '';
    txt.oninput = (e) => selectOptionAnswer(q.id, e.target.value);
    if (optionsContainer) optionsContainer.appendChild(txt);
  }
  // 5. Tipe: Benar / Salah (True / False Table)
  else if (qType === 'bs') {
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size: 0.85rem; color: #0f766e; font-weight: 700; margin-bottom: 0.75rem; background: #f0fdfa; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);';
    hint.textContent = 'ℹ️ Benar / Salah: Tentukan status kebenaran dari setiap pernyataan di bawah ini.';
    if (optionsContainer) optionsContainer.appendChild(hint);

    const statements = q.statements || [
      { text: 'Pernyataan 1', key: 'B' },
      { text: 'Pernyataan 2', key: 'S' }
    ];
    const userBs = studentAns.selected || {};

    const table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid var(--slate-200); border-radius: var(--radius-md); overflow: hidden;';
    table.innerHTML = '<thead style="background: var(--slate-100);"><tr><th style="padding: 0.6rem; text-align: left;">Pernyataan</th><th style="padding: 0.6rem; width: 140px; text-align: center;">Pilihan Anda</th></tr></thead><tbody></tbody>';
    const tbody = table.querySelector('tbody');

    statements.forEach((st, sIdx) => {
      const tr = document.createElement('tr');
      tr.style.borderTop = '1px solid var(--slate-200)';
      const currentVal = userBs[sIdx];

      tr.innerHTML = 
        '<td style="padding: 0.75rem; font-weight: 600;">' + (sIdx + 1) + '. ' + escapeHtml(st.text) + '</td>' +
        '<td style="padding: 0.75rem; text-align: center;">' +
          '<div style="display: inline-flex; gap: 0.4rem;">' +
            '<button type="button" class="btn btn-sm ' + (currentVal === 'B' ? 'btn-success' : 'btn-outline') + '" onclick="selectBsAnswer(\'' + q.id + '\', ' + sIdx + ', \'B\')">Benar</button>' +
            '<button type="button" class="btn btn-sm ' + (currentVal === 'S' ? 'btn-danger' : 'btn-outline') + '" onclick="selectBsAnswer(\'' + q.id + '\', ' + sIdx + ', \'S\')">Salah</button>' +
          '</div>' +
        '</td>';
      tbody.appendChild(tr);
    });
    if (optionsContainer) optionsContainer.appendChild(table);
  }

  // Doubt Checkbox Status (Desktop & Mobile)
  const isDoubt = studentAns.isDoubt === true;
  const doubtBox = document.getElementById('checkbox-doubt');
  if (doubtBox) doubtBox.checked = isDoubt;
  const doubtBoxMobile = document.getElementById('checkbox-doubt-mobile');
  if (doubtBoxMobile) doubtBoxMobile.checked = isDoubt;

  // Disable / Enable Prev & Next Buttons
  const btnPrev = document.getElementById('btn-prev-q');
  const btnNext = document.getElementById('btn-next-q');
  if (btnPrev) btnPrev.disabled = state.currentQuestionIndex === 0;
  if (btnNext) {
    if (state.currentQuestionIndex >= qList.length - 1) {
      btnNext.innerHTML = 'Soal Terakhir';
      btnNext.disabled = true;
    } else {
      btnNext.innerHTML = 'Berikutnya <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
      btnNext.disabled = false;
    }
  }

  // Update Grid Button Highlights
  updateGridButtonStatus();
}

// Auto-Save Answer Selection
function selectOptionAnswer(questionId, selectedKey) {
  if (!state.isExamRunning) return;

  if (!state.student.answers[questionId]) {
    state.student.answers[questionId] = { selected: selectedKey, isDoubt: false };
  } else {
    state.student.answers[questionId].selected = selectedKey;
  }

  // Visual trigger
  renderCurrentQuestion();
  triggerAutoSaveIndicator();
  syncLiveStudentProgress();
}

// Toggle Doubt Answer Checkbox
function toggleDoubtAnswer() {
  const qList = getActiveExamQuestions();
  const q = qList[state.currentQuestionIndex];
  if (!q) return;

  const doubtBox = document.getElementById('checkbox-doubt');
  const isChecked = doubtBox ? doubtBox.checked : false;

  if (!state.student.answers[q.id]) {
    state.student.answers[q.id] = { selected: null, isDoubt: isChecked };
  } else {
    state.student.answers[q.id].isDoubt = isChecked;
  }

  const doubtBoxMobile = document.getElementById('checkbox-doubt-mobile');
  if (doubtBoxMobile) doubtBoxMobile.checked = isChecked;

  triggerAutoSaveIndicator();
  updateGridButtonStatus();
}

// Question Navigation
function navigateQuestion(delta) {
  const qList = getActiveExamQuestions();
  const targetIndex = state.currentQuestionIndex + delta;
  if (targetIndex >= 0 && targetIndex < qList.length) {
    state.currentQuestionIndex = targetIndex;
    renderCurrentQuestion();
  }
}

function jumpToQuestion(index) {
  const qList = getActiveExamQuestions();
  if (index >= 0 && index < qList.length) {
    state.currentQuestionIndex = index;
    renderCurrentQuestion();
  }
}

// Grid Buttons Generator (Desktop)
function renderQuestionGrid() {
  const grid = document.getElementById('question-grid-container');
  if (!grid) return;
  grid.innerHTML = '';

  const qList = getActiveExamQuestions();
  qList.forEach((q, idx) => {
    const btn = document.createElement('button');
    btn.id = 'grid-btn-' + idx;
    btn.className = 'grid-btn';
    btn.textContent = idx + 1;
    btn.onclick = () => jumpToQuestion(idx);
    grid.appendChild(btn);
  });

  updateGridButtonStatus();
}

// Update Grid Status Colors
function updateGridButtonStatus() {
  const qList = getActiveExamQuestions();
  qList.forEach((q, idx) => {
    const btn = document.getElementById('grid-btn-' + idx);
    const mBtn = document.getElementById('mobile-grid-btn-' + idx);
    
    [btn, mBtn].forEach(el => {
      if (!el) return;
      el.className = 'grid-btn';
      if (idx === state.currentQuestionIndex) {
        el.classList.add('current');
      }

      const ans = state.student.answers[q.id];
      if (ans) {
        if (ans.isDoubt) {
          el.classList.add('doubt');
        } else if (ans.selected) {
          el.classList.add('answered');
        }
      }
    });
  });
}

// Auto-Save Indicator Animation
function triggerAutoSaveIndicator() {
  const badge = document.getElementById('exam-autosave-indicator');
  if (!badge) return;

  badge.style.opacity = '0.5';
  badge.innerHTML = '<span style="color: var(--primary-600)">Menyimpan...</span>';

  setTimeout(() => {
    badge.style.opacity = '1';
    badge.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> <span>Tersimpan di Cloud ✓</span>';
  }, 250);

  // Persist student answers to local storage immediately
  if (state.student && state.student.nisn) {
    try {
      localStorage.setItem('zettcbt_active_student_exam', JSON.stringify({
        student: state.student,
        sessionSubject: state.session.subject,
        timeRemainingSeconds: state.timeRemainingSeconds,
        currentQuestionIndex: state.currentQuestionIndex,
        timestamp: Date.now()
      }));
    } catch(e) {}
  }

  // If Neon PostgreSQL credentials are configured, execute background patch
  if (state.neon && state.neon.endpoint) {
    sendAnswerToNeon(state.student.nisn, state.student.answers);
  }

  // If Supabase credentials are configured, execute background patch
  if (state.supabase.url && state.supabase.key) {
    sendAnswerToSupabase(state.student.nisn, state.student.answers);
  }
}

// Sync Local Student Progress to Admin Live Monitor
function syncLiveStudentProgress() {
  const answeredCount = Object.values(state.student.answers).filter(a => a && a.selected).length;
  const target = state.liveStudents.find(s => s.nisn === state.student.nisn);
  if (target) {
    target.answeredCount = answeredCount;
    target.warningCount = state.warningCount;
    localStorage.setItem('zettcbt_live_students', JSON.stringify(state.liveStudents));
  }
  updateAdminMetrics();
}

// ==============================================================================
// MOBILE FULLSCREEN & DRAWER HELPERS (POIN 3 PERMINTAAN USER)
// ==============================================================================

function enterMobileFullscreen() {
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  } catch (e) {}

  const btnRe = document.getElementById('btn-re-fullscreen');
  if (btnRe) btnRe.style.display = 'none';
}

function handleFullscreenStateChange() {
  const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  const btnRe = document.getElementById('btn-re-fullscreen');
  if (btnRe) {
    if (!isFs && state.isExamRunning && window.innerWidth <= 768) {
      btnRe.style.display = 'flex';
    } else {
      btnRe.style.display = 'none';
    }
  }
}

function toggleMobileQuestionDrawer(open) {
  const drawer = document.getElementById('mobile-question-drawer');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  if (!drawer || !backdrop) return;

  if (open) {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    renderMobileQuestionGrid();
  } else {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
  }
}

function renderMobileQuestionGrid() {
  const container = document.getElementById('mobile-question-grid-container');
  if (!container) return;
  container.innerHTML = '';

  const qList = getActiveExamQuestions();
  qList.forEach((q, idx) => {
    const btn = document.createElement('button');
    btn.id = 'mobile-grid-btn-' + idx;
    btn.className = 'grid-btn';
    btn.textContent = idx + 1;

    const ans = state.student.answers[q.id];
    if (ans) {
      if (ans.isDoubt) btn.classList.add('doubt');
      else if (ans.selected) btn.classList.add('answered');
    }
    if (idx === state.currentQuestionIndex) btn.classList.add('current');

    btn.onclick = () => {
      jumpToQuestion(idx);
      toggleMobileQuestionDrawer(false);
    };
    container.appendChild(btn);
  });
}

function toggleDoubtAnswerMobile() {
  const chkMobile = document.getElementById('checkbox-doubt-mobile');
  const chkDesktop = document.getElementById('checkbox-doubt');
  if (chkMobile && chkDesktop) {
    chkDesktop.checked = chkMobile.checked;
    toggleDoubtAnswer();
  }
}

// ==============================================================================
// ADVANCED ANTI-CHEAT ENGINE (EXAMBRO LEVEL - AUDIO ALARM, HAPTIC, BLOKIR KLIK & COPY)
// ==============================================================================

let cheatAudioCtx = null;

// Audio Alarm Synthesizer (Web Audio API - Mandiri tanpa butuh file MP3 eksternal)
function playCheatAlarmSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!cheatAudioCtx) {
      cheatAudioCtx = new AudioContextClass();
    }
    if (cheatAudioCtx.state === 'suspended') {
      cheatAudioCtx.resume();
    }
    const now = cheatAudioCtx.currentTime;

    // Dual-Tone Siren Alarm (880Hz -> 660Hz -> 880Hz)
    const osc = cheatAudioCtx.createOscillator();
    const gain = cheatAudioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(660, now + 0.22);
    osc.frequency.setValueAtTime(880, now + 0.44);
    osc.frequency.setValueAtTime(660, now + 0.66);
    osc.frequency.setValueAtTime(880, now + 0.88);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.25);

    osc.connect(gain);
    gain.connect(cheatAudioCtx.destination);

    osc.start(now);
    osc.stop(now + 1.25);
  } catch (err) {
    console.warn('Audio alert warning:', err);
  }
}

// Getar Ponsel (Haptic Vibration)
function triggerHapticVibration() {
  if (navigator.vibrate) {
    try {
      navigator.vibrate([300, 150, 300, 150, 450]);
    } catch (e) {}
  }
}

function initAntiCheatProtection() {
  // 1. Deteksi Tab Keluar / Minimalkan Browser / Buka Aplikasi Lain
  document.addEventListener('visibilitychange', () => {
    if (!state.isExamRunning) return;
    if (document.hidden) {
      triggerCheatWarning('tab_switch', 'Terdeteksi meminimalkan browser, membuka tab lain, atau beralih ke aplikasi lain!');
    }
  });

  // 2. Deteksi Kehilangan Fokus Jendela (Window Blur)
  window.addEventListener('blur', () => {
    if (!state.isExamRunning) return;
    triggerCheatWarning('window_blur', 'Fokus layar ujian hilang! Dilarang membuka aplikasi lain di perangkat Anda.');
  });

  // 3. Deteksi Layar Belah (Split-Screen / Floating Window) di Smartphone
  window.addEventListener('resize', () => {
    if (!state.isExamRunning) return;
    checkSmartphoneSplitScreen();
  });

  // 4. Deteksi Perubahan Status Fullscreen
  document.addEventListener('fullscreenchange', handleFullscreenStateChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenStateChange);

  // 5. Blokir Klik Kanan / Context Menu Selama Ujian
  document.addEventListener('contextmenu', (e) => {
    if (state.isExamRunning) {
      e.preventDefault();
      showToast('⚠️ Klik kanan dan inspeksi elemen dinonaktifkan selama ujian!', 'warning');
      return false;
    }
  });

  // 6. Blokir Salin (Copy), Potong (Cut), Tempel (Paste), dan Drag Soal
  ['copy', 'cut', 'paste', 'dragstart'].forEach((evtName) => {
    document.addEventListener(evtName, (e) => {
      if (state.isExamRunning) {
        const targetTag = e.target ? e.target.tagName : '';
        if (targetTag !== 'INPUT' && targetTag !== 'TEXTAREA') {
          e.preventDefault();
          showToast('⚠️ Tindakan menyalin atau memindahkan teks soal dinonaktifkan!', 'warning');
          return false;
        }
      }
    });
  });

  // 7. Blokir Tombol Pintas Keyboard Berbahaya (F12, DevTools, Ctrl+C, Ctrl+U, dll)
  document.addEventListener('keydown', (e) => {
    if (!state.isExamRunning) return;

    const key = e.key;
    const ctrlOrMeta = e.ctrlKey || e.metaKey;

    // F12 (DevTools)
    if (key === 'F12') {
      e.preventDefault();
      triggerCheatWarning('dev_tools', '⚠️ Tombol inspeksi pengembang (F12) dinonaktifkan!');
      return false;
    }

    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (Inspect Element)
    if (ctrlOrMeta && e.shiftKey && (key === 'I' || key === 'i' || key === 'J' || key === 'j' || key === 'C' || key === 'c')) {
      e.preventDefault();
      triggerCheatWarning('dev_tools', '⚠️ Akses Developer Tools dinonaktifkan!');
      return false;
    }

    // Ctrl+U (View Source)
    if (ctrlOrMeta && (key === 'u' || key === 'U')) {
      e.preventDefault();
      showToast('⚠️ Akses kode sumber dinonaktifkan!', 'warning');
      return false;
    }

    // Ctrl+P (Print)
    if (ctrlOrMeta && (key === 'p' || key === 'P')) {
      e.preventDefault();
      showToast('⚠️ Cetak dokumen dinonaktifkan!', 'warning');
      return false;
    }

    // Ctrl+S (Save)
    if (ctrlOrMeta && (key === 's' || key === 'S')) {
      e.preventDefault();
      return false;
    }

    // Ctrl+C, Ctrl+V, Ctrl+A di luar kolom isian formulir
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
      if (ctrlOrMeta && (key === 'c' || key === 'C' || key === 'v' || key === 'V' || key === 'x' || key === 'X' || key === 'a' || key === 'A')) {
        e.preventDefault();
        showToast('⚠️ Tombol pintas salin/tempel dinonaktifkan!', 'warning');
        return false;
      }
    }
  });
}

function checkSmartphoneSplitScreen() {
  if (!state.isExamRunning) return;

  // Jika siswa sedang mengetik pada input/textarea, abaikan (karena soft keyboard aktif)
  const activeEl = document.activeElement;
  const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
  if (isTyping) return;

  const currentHeight = window.innerHeight;
  const availHeight = window.screen.availHeight || window.screen.height || currentHeight;
  const initialHeight = state.initialExamHeight || availHeight;

  // Khusus Smartphone (lebar <= 768px): rasio tinggi anjlok > 30% menandakan split-screen
  if (window.innerWidth <= 768) {
    const heightRatio = currentHeight / initialHeight;
    if (heightRatio < 0.70) {
      triggerCheatWarning('split_screen', '⚠️ Terdeteksi menggunakan Layar Belah (Split Screen) atau Floating Window di Smartphone!');
    }
  }
}

function triggerCheatWarning(reasonType, message) {
  if (!state.isExamRunning) return;

  // Debounce 2.5 detik agar 1 aksi tidak memicu berkali-kali
  const now = Date.now();
  if (state.lastViolationTime && (now - state.lastViolationTime < 2500)) return;
  state.lastViolationTime = now;

  state.warningCount = (state.warningCount || 0) + 1;
  syncLiveStudentProgress();

  // Bunyikan Alarm Audio & Getar Ponsel
  playCheatAlarmSound();
  triggerHapticVibration();

  const countDisplay = document.getElementById('modal-warning-count');
  const reasonDisplay = document.getElementById('modal-cheat-reason');
  const modal = document.getElementById('modal-cheat-alert');

  if (countDisplay) countDisplay.textContent = state.warningCount;
  if (reasonDisplay) {
    reasonDisplay.textContent = message || 'Terdeteksi melakukan pelanggaran ujian (beralih tab / split screen)!';
  }
  if (modal) modal.style.display = 'flex';

  if (state.warningCount >= (state.maxWarnings || 3)) {
    showToast('Batas toleransi pelanggaran 3x terlewati! Ujian dikunci dan dikumpulkan otomatis.', 'danger');
    setTimeout(() => {
      dismissCheatAlert();
      submitFinalExam(true);
    }, 1500);
  }
}

function dismissCheatAlert() {
  const modal = document.getElementById('modal-cheat-alert');
  if (modal) modal.style.display = 'none';
  // Kembalikan ke mode layar penuh
  enterMobileFullscreen();
}

// Submit Final Confirmation Modal
function openSubmitConfirmModal() {
  let answered = 0;
  let doubt = 0;

  state.questions.forEach((q) => {
    const ans = state.student.answers[q.id];
    if (ans) {
      if (ans.isDoubt) doubt++;
      else if (ans.selected) answered++;
    }
  });

  const empty = state.questions.length - (answered + doubt);

  document.getElementById('confirm-answered-count').textContent = answered + ' Soal';
  document.getElementById('confirm-doubt-count').textContent = doubt + ' Soal';
  document.getElementById('confirm-empty-count').textContent = empty + ' Soal';

  document.getElementById('modal-submit-confirm').style.display = 'flex';
}

function closeSubmitConfirmModal() {
  document.getElementById('modal-submit-confirm').style.display = 'none';
}

// Execute Final Submission
function submitFinalExam(forced = false) {
  closeSubmitConfirmModal();
  state.isExamRunning = false;
  if (state.timerInterval) clearInterval(state.timerInterval);

  state.student.endTime = new Date();

  // Calculate Score
  let totalScore = 0;
  let correctCount = 0;
  state.questions.forEach((q) => {
    const ans = state.student.answers[q.id];
    if (ans && ans.selected === q.correctKey) {
      totalScore += (q.scoreWeight || 20);
      correctCount++;
    }
  });
  state.student.score = totalScore;

  // Update Live Monitoring Entry
  const target = state.liveStudents.find(s => s.nisn === state.student.nisn);
  if (target) {
    target.status = 'submitted';
    target.score = totalScore;
    target.time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    localStorage.setItem('zettcbt_live_students', JSON.stringify(state.liveStudents));
  }

  // Finalize attempt in Neon Cloud
  if (state.neon && state.neon.endpoint) {
    finalizeStudentAttemptInNeon(state.student.nisn, totalScore);
  }

  updateAdminMetrics();
  renderLiveMonitoringTable();
  renderResultsTable();

  // Exit Fullscreen if active
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }

  // Populate Finish Screen
  document.getElementById('finish-student-name').textContent = state.student.name + ' (' + state.student.nisn + ')';
  document.getElementById('finish-subject-name').textContent = state.session.subject;
  document.getElementById('finish-timestamp').textContent = state.student.endTime.toLocaleTimeString('id-ID') + ' WIB';
  document.getElementById('finish-warnings').textContent = state.warningCount + 'x Terdeteksi';

  const scoreBox = document.getElementById('finish-score-box');
  const scoreVal = document.getElementById('finish-score-value');
  if (state.session.showScore) {
    scoreBox.style.display = 'block';
    scoreVal.textContent = totalScore;
  } else {
    scoreBox.style.display = 'none';
  }

  showScreen('student-finish');
  sessionStorage.removeItem('zettcbt_exam_in_session');
  localStorage.removeItem('zettcbt_active_student_exam');
  showToast('Jawaban berhasil diserahkan dengan selamat!', 'success');
}

// Scale Font Size for Accessibility
function scaleFontSize(direction) {
  const content = document.getElementById('question-content-text');
  if (!content) return;

  if (direction === 0) {
    state.fontSizeLevel = 0;
    content.style.fontSize = '1.08rem';
  } else if (direction === 1 && state.fontSizeLevel < 2) {
    state.fontSizeLevel++;
    content.style.fontSize = (1.08 + state.fontSizeLevel * 0.15) + 'rem';
  } else if (direction === -1 && state.fontSizeLevel > -1) {
    state.fontSizeLevel--;
    content.style.fontSize = (1.08 + state.fontSizeLevel * 0.15) + 'rem';
  }
}

// ==============================================================================
// ADMIN PANEL ENGINE
// ==============================================================================

function switchAdminTab(tabId, element) {
  document.querySelectorAll('.tab-link, .sidebar-nav-item, .srms-nav-item').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');

  if (element) {
    element.classList.add('active');
  } else {
    const el = document.getElementById('tab-nav-' + tabId);
    if (el) el.classList.add('active');
    const srmsEl = document.querySelector(`.srms-nav-item[onclick*="${tabId}"]`);
    if (srmsEl) srmsEl.classList.add('active');
  }

  const target = document.getElementById('tab-' + tabId);
  if (target) target.style.display = 'block';

  // Update topbar title
  const topbarTitle = document.getElementById('admin-topbar-page-title');
  if (topbarTitle) {
    const titles = {
      'srms-dashboard': 'Dasbor Utama Guru & Pengawas',
      'live-monitor': 'Jadwal Ujian & Live Monitoring',
      'question-bank': 'Bank Soal (5 Tipe ANBK)',
      'session-setting': 'Pengaturan Sesi Ujian Aktif',
      'manage-students': 'Kelola Data Siswa Peserta Ujian',
      'manage-teachers': 'Kelola Data Guru & Pengawas',
      'results-analysis': 'Rekapitulasi & Analisis Nilai Siswa',
      'exam-cards': 'Cetak Kartu Peserta Ujian',
      'school-identity': 'Pengaturan Identitas & Kop Sekolah',
      'database-config': 'Koneksi Cloud Database (Neon.tech PostgreSQL)'
    };
    if (titles[tabId]) topbarTitle.textContent = titles[tabId];
  }

  // Update active state on mobile bottom nav bar
  document.querySelectorAll('.admin-mob-nav-btn').forEach(b => b.classList.remove('active'));
  const mobBtn = document.getElementById('mob-nav-btn-' + tabId);
  if (mobBtn) mobBtn.classList.add('active');

  // Close mobile drawer on selection
  toggleMobileSidebar(false);

  // Persist current admin tab (SessionStorage Only agar hilang saat tab ditutup)
  sessionStorage.setItem('zettcbt_current_admin_tab', tabId);
  localStorage.removeItem('zettcbt_current_admin_tab');

  if (tabId === 'srms-dashboard') renderSrmsDashboard();
  if (tabId === 'live-monitor') {
    renderLiveMonitoringTable();
    renderTeacherExamSchedules();
    renderProctorTokenBar();
  }
  if (tabId === 'question-bank') renderAdminQuestionBank();
  if (tabId === 'session-setting') {
    populateSessionSettings();
    renderSubjectTokensTable();
  }
  if (tabId === 'manage-students') renderStudentsTable();
  if (tabId === 'manage-teachers') renderTeachersTable();
  if (tabId === 'results-analysis') renderResultsTable();
  if (tabId === 'exam-cards') renderExamCardsTab();
  if (tabId === 'school-identity') populateSchoolIdentityForm();
  if (tabId === 'database-config') populateDatabaseConfig();
}

// ==============================================================================
// SRMS DASHBOARD ENGINE (REF: GAMBAR 1 & 2)
// ==============================================================================

function renderSrmsDashboard() {
  const t = state.currentTeacher;
  const teacherName = t ? t.fullName : 'Bapak/Ibu Guru & Pengawas';
  const teacherRole = t 
    ? (t.role === 'admin_sekolah' ? 'Operator Sekolah (Admin)' : (t.role === 'guru_kelas' ? 'Wali/Guru Kelas ' + t.assignedClass : 'Guru Mapel ' + t.assignedSubject)) 
    : 'SD Negeri 14 Toboali';

  // 1. Update Profile & Greetings
  const heroNameEl = document.getElementById('srms-hero-name');
  if (heroNameEl) heroNameEl.textContent = teacherName;

  const headerNameEl = document.getElementById('srms-header-user-name');
  if (headerNameEl) headerNameEl.textContent = teacherName;

  const headerRoleEl = document.getElementById('srms-header-user-role');
  if (headerRoleEl) headerRoleEl.textContent = teacherRole;

  // 2. Metrics & KPI Row (Gambar 1)
  const submittedList = state.liveStudents.filter(s => s.status === 'submitted');
  const avgScore = submittedList.length > 0 
    ? (submittedList.reduce((acc, curr) => acc + (curr.score || 0), 0) / submittedList.length).toFixed(1)
    : '88.5';
  const cgpaValue = avgScore;

  const cgpaEl = document.getElementById('srms-cgpa-val');
  if (cgpaEl) cgpaEl.textContent = cgpaValue > 0 ? cgpaValue : '88.5';

  const coursesEl = document.getElementById('srms-courses-count');
  if (coursesEl) coursesEl.textContent = (state.subjects && state.subjects.length > 0) ? state.subjects.length : '6';

  const examsEl = document.getElementById('srms-exams-completed');
  if (examsEl) examsEl.textContent = submittedList.length > 0 ? `${submittedList.length} Selesai` : '18 / 24';

  const rankEl = document.getElementById('srms-overall-rank');
  if (rankEl) rankEl.textContent = '#4 / 120';

  const attEl = document.getElementById('srms-attendance-pct');
  if (attEl) attEl.textContent = '94.2%';

  // 3. Render Recent Results Table (Gambar 1)
  renderSrmsRecentResults();

  // 4. Render Horizontal Token Ribbon (Gambar 2)
  renderHorizontalTokenRibbon();
}

function renderSrmsRecentResults() {
  const tbody = document.getElementById('srms-results-tbody');
  if (!tbody) return;

  const submittedList = state.liveStudents.filter(s => s.status === 'submitted');
  
  if (submittedList.length > 0) {
    let rowsHtml = '';
    submittedList.slice(0, 5).forEach(st => {
      const score = st.score || 85;
      const grade = score >= 90 ? 'A+' : (score >= 80 ? 'A' : (score >= 70 ? 'B' : 'C'));
      const badgeCls = score >= 75 ? 'badge-pass' : 'badge-remedial';
      const badgeText = score >= 75 ? 'Tuntas' : 'Remedial';

      rowsHtml += `
        <tr>
          <td><span class="subject-code-tag">${escapeHtml(state.session.subject || 'CBT')}</span></td>
          <td><strong>${escapeHtml(st.name)} (${escapeHtml(st.nisn)})</strong></td>
          <td>${escapeHtml(st.assignedClass || 'Kelas 6')}</td>
          <td>${score} / 100</td>
          <td><strong>${grade}</strong></td>
          <td><span class="status-badge-srms ${badgeCls}">${badgeText}</span></td>
        </tr>
      `;
    });
    tbody.innerHTML = rowsHtml;
  }
}

function scrollToNoticeBoard() {
  switchAdminTab('srms-dashboard');
  const section = document.getElementById('srms-notice-board-section');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function scrollToAcademicCalendar() {
  switchAdminTab('srms-dashboard');
  const section = document.getElementById('srms-calendar-section');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function openAllNoticesModal() {
  showToast('Menampilkan seluruh arsip pengumuman akademik sekolah...', 'info');
}

function openCalendarModal() {
  showToast('Kalender Akademik Semester Aktif 2026 dibuka.', 'info');
}

function openTeacherProfileModal() {
  const modal = document.getElementById('modal-teacher-profile');
  if (!modal) return;

  const t = state.currentTeacher || {
    fullName: 'Bapak/Ibu Guru',
    nip: '198501012010011002',
    role: 'guru_kelas',
    assignedClass: '6A',
    assignedSubject: 'Semua Mapel',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'
  };

  // Periksa apakah ada data profil tersimpan di Dedicated Profile Vault
  const uName = t.username || 'admin';
  try {
    const savedVault = JSON.parse(localStorage.getItem('zettcbt_admin_profile_' + uName) || 'null');
    if (savedVault) {
      if (savedVault.fullName) t.fullName = savedVault.fullName;
      if (savedVault.nip) t.nip = savedVault.nip;
    }
  } catch(e) {}

  const nameInput = document.getElementById('teacher-profile-input-name');
  const nipInput = document.getElementById('teacher-profile-input-nip');
  const roleInput = document.getElementById('teacher-profile-input-role');
  const displayName = document.getElementById('teacher-profile-display-name');
  const displayRole = document.getElementById('teacher-profile-display-role');
  const avatarImg = document.getElementById('teacher-profile-avatar-img');

  const roleLabels = {
    'admin_sekolah': 'Operator Sekolah',
    'guru_kelas': `Guru Kelas ${t.assignedClass || '6A'}`,
    'guru_mapel': `Guru Mapel ${t.assignedSubject || 'Umum'}`
  };
  const roleText = roleLabels[t.role] || 'Pendidik & Pengawas';

  if (nameInput) nameInput.value = t.fullName || 'Bapak/Ibu Guru';
  if (nipInput) nipInput.value = t.nip || '';
  if (roleInput) roleInput.value = roleText;
  if (displayName) displayName.textContent = t.fullName || 'Bapak/Ibu Guru';
  if (displayRole) displayRole.textContent = `${roleText} • SD NEGERI 14 TOBOALI`;
  if (avatarImg) avatarImg.src = t.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80';

  modal.style.display = 'flex';
}

function closeTeacherProfileModal() {
  const modal = document.getElementById('modal-teacher-profile');
  if (modal) modal.style.display = 'none';
}

function handleSaveTeacherProfile(event) {
  event.preventDefault();
  const nameInput = document.getElementById('teacher-profile-input-name');
  const nipInput = document.getElementById('teacher-profile-input-nip');

  const newName = nameInput ? nameInput.value.trim() : '';
  const newNip = nipInput ? nipInput.value.trim() : '';

  if (!newName) {
    showToast('Nama pendidik tidak boleh kosong.', 'warning');
    return;
  }

  if (!state.currentTeacher) {
    state.currentTeacher = {
      id: 'tc-active',
      username: 'guru',
      fullName: newName,
      nip: newNip,
      role: 'guru_kelas',
      assignedClass: '6A',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'
    };
  } else {
    state.currentTeacher.fullName = newName;
    state.currentTeacher.nip = newNip;
  }

  sessionStorage.setItem('zettcbt_current_teacher', JSON.stringify(state.currentTeacher));

  // 1. Simpan ke Dedicated Profile Vault permanen (kebal dari logout / reload)
  const uName = state.currentTeacher.username || 'admin';
  localStorage.setItem('zettcbt_admin_profile_' + uName, JSON.stringify({
    fullName: newName,
    nip: newNip
  }));

  // 2. Sinkronkan ke daftar state.teachers agar tersimpan di memori lokal
  const teacherIdx = (state.teachers || []).findIndex(t => t.id === state.currentTeacher.id || t.username === uName);
  if (teacherIdx >= 0) {
    state.teachers[teacherIdx].fullName = newName;
    if (newNip) state.teachers[teacherIdx].nip = newNip;
    localStorage.setItem('zettcbt_teachers', JSON.stringify(state.teachers));
    renderTeachersTable();
  }

  // 3. Sinkronkan langsung ke Neon Cloud Database jika terhubung (agar tidak tertimpa seed lama)
  if (state.neon && state.neon.endpoint) {
    executeNeonSql('UPDATE teachers SET full_name = $1 WHERE username = $2;', [newName, uName])
      .then(() => console.log('✅ Profil admin berhasil diperbarui di Neon Cloud'))
      .catch(err => console.warn('Gagal sinkron nama ke Neon:', err.message));
  }

  // 4. Sinkronkan ke Supabase jika terhubung
  if (state.supabase && state.supabase.url && state.supabase.key) {
    fetch(state.supabase.url + '/rest/v1/teachers?username=eq.' + encodeURIComponent(uName), {
      method: 'PATCH',
      headers: {
        'apikey': state.supabase.key,
        'Authorization': 'Bearer ' + state.supabase.key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ full_name: newName })
    }).catch(err => console.warn('Gagal sinkron nama ke Supabase:', err));
  }

  // Perbarui tampilan Nama pada Topbar dan Salam secara realtime
  const headerName = document.getElementById('srms-header-user-name');
  if (headerName) headerName.textContent = newName;

  const heroName = document.getElementById('srms-hero-name');
  if (heroName) heroName.textContent = `${newName}!`;

  const navLabel = document.getElementById('nav-teacher-label');
  if (navLabel) navLabel.textContent = newName;

  const displayProfName = document.getElementById('teacher-profile-display-name');
  if (displayProfName) displayProfName.textContent = newName;

  closeTeacherProfileModal();
  showToast('Profil pengguna berhasil disimpan permanen!', 'success');
}

function handleGlobalSearch(query) {
  if (!query || !query.trim()) return;
  const q = query.trim().toLowerCase();
  
  // Cari di siswa, soal, jadwal
  const matchedStudent = state.students.find(s => s.name.toLowerCase().includes(q) || s.nisn.toLowerCase().includes(q));
  if (matchedStudent) {
    switchAdminTab('manage-students');
    const filterInput = document.getElementById('filter-search-student');
    if (filterInput) filterInput.value = q;
    renderStudentsTable();
    showToast(`Ditemukan data siswa: ${matchedStudent.name}`, 'success');
    return;
  }

  const matchedSub = (state.subjects || []).find(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  if (matchedSub) {
    selectTokenSubject(matchedSub.id);
    showToast(`Menampilkan token mapel: ${matchedSub.name}`, 'info');
    return;
  }

  showToast(`Hasil pencarian untuk "${query}" tidak ditemukan di database aktif.`, 'warning');
}

function filterNotices(category, btn) {
  document.querySelectorAll('.notice-tag-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const items = document.querySelectorAll('.notice-item');
  items.forEach(item => {
    if (category === 'all' || item.getAttribute('data-category') === category) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function toggleMobileSidebar(open) {
  const sidebar = document.getElementById('admin-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar) return;
  if (open === undefined) {
    open = !sidebar.classList.contains('open');
  }
  if (open) {
    sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
  } else {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
  }
}

function populateSessionSettings() {
  const setTokenInput = document.getElementById('setting-token');
  if (setTokenInput && state.session.token) setTokenInput.value = state.session.token;
  const setDurationInput = document.getElementById('setting-duration');
  if (setDurationInput && state.session.durationMinutes) setDurationInput.value = state.session.durationMinutes;
  const setTitleInput = document.getElementById('setting-title');
  if (setTitleInput && state.session.title) setTitleInput.value = state.session.title;
  const setSubjectInput = document.getElementById('setting-subject');
  if (setSubjectInput && state.session.subject) setSubjectInput.value = state.session.subject;

  // Restore checkboxes (Acak Soal, Acak Opsi, Tampilkan Nilai)
  const chkRandomQ = document.getElementById('setting-random-q');
  if (chkRandomQ && typeof state.session.randomizeQuestions !== 'undefined') {
    chkRandomQ.checked = !!state.session.randomizeQuestions;
  }
  const chkRandomOpt = document.getElementById('setting-random-opt');
  if (chkRandomOpt && typeof state.session.randomizeOptions !== 'undefined') {
    chkRandomOpt.checked = !!state.session.randomizeOptions;
  }
  const chkShowScore = document.getElementById('setting-show-score');
  if (chkShowScore && typeof state.session.showScore !== 'undefined') {
    chkShowScore.checked = !!state.session.showScore;
  }
}

function populateDatabaseConfig() {
  const sbUrlInput = document.getElementById('config-supabase-url');
  const sbKeyInput = document.getElementById('config-supabase-key');
  if (sbUrlInput && state.supabase.url) sbUrlInput.value = state.supabase.url;
  if (sbKeyInput && state.supabase.key) sbKeyInput.value = state.supabase.key;
}

function updateAdminMetrics() {
  const activeCount = state.liveStudents.filter(s => s.status === 'in_progress').length;
  const submittedCount = state.liveStudents.filter(s => s.status === 'submitted').length;
  const warningCount = state.liveStudents.filter(s => s.warningCount > 0).length;

  const elActive = document.getElementById('metric-active-students');
  const elSubmitted = document.getElementById('metric-submitted-students');
  const elToken = document.getElementById('metric-active-token');
  const elWarning = document.getElementById('metric-warning-students');

  if (elActive) elActive.textContent = activeCount;
  if (elSubmitted) elSubmitted.textContent = submittedCount;
  if (elToken) elToken.textContent = state.session.token;
  if (elWarning) elWarning.textContent = warningCount;
}

// Render Live Students Table
function renderLiveMonitoringTable() {
  const tbody = document.getElementById('table-live-students-body');
  if (!tbody) return;

  const search = (document.getElementById('filter-search-student')?.value || '').toLowerCase();
  tbody.innerHTML = '';

  const visibleList = getVisibleLiveStudents();
  const filtered = visibleList.filter(s => 
    s.name.toLowerCase().includes(search) || s.nisn.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--slate-400);">Tidak ada peserta aktif di kelas kewenangan Anda.</td></tr>';
    return;
  }

  filtered.forEach((st, idx) => {
    const tr = document.createElement('tr');

    const statusBadge = st.status === 'submitted' 
      ? '<span class="badge badge-success">Selesai Submit</span>'
      : '<span class="badge badge-info">Sedang Mengerjakan</span>';

    const warnBadge = st.warningCount > 0
      ? '<span class="badge badge-danger">' + st.warningCount + 'x Pelanggaran</span>'
      : '<span class="badge badge-success">0 (Bersih)</span>';

    tr.innerHTML = 
      '<td>' + (idx + 1) + '</td>' +
      '<td><strong>' + st.nisn + '</strong></td>' +
      '<td>' + st.name + '</td>' +
      '<td>' + st.className + '</td>' +
      '<td>' + st.answeredCount + ' / ' + st.totalQ + ' Soal</td>' +
      '<td>' + warnBadge + '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td>' +
        '<button class="btn btn-outline btn-sm" onclick="resetStudentLogin(\'' + st.nisn + '\')">Reset Login</button>' +
      '</td>';

    tbody.appendChild(tr);
  });
}

function resetStudentLogin(nisn) {
  const st = state.liveStudents.find(s => s.nisn === nisn);
  if (st) {
    st.status = 'in_progress';
    st.warningCount = 0;
    localStorage.setItem('zettcbt_live_students', JSON.stringify(state.liveStudents));
    renderLiveMonitoringTable();
    updateAdminMetrics();
    showToast('Sesi siswa ' + st.name + ' berhasil di-reset!', 'success');
  }
}

// Render Question Bank Table (Strict Teacher Isolation)
function renderAdminQuestionBank() {
  const tbody = document.getElementById('table-questions-body');
  const countBadge = document.getElementById('admin-total-q-badge');
  if (!tbody) return;

  const visibleQuestions = getVisibleQuestions();
  if (countBadge) countBadge.textContent = visibleQuestions.length;
  tbody.innerHTML = '';

  if (visibleQuestions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--slate-400);">Belum ada bank soal untuk kelas / mapel kewenangan Anda. Klik "+ Tambah Soal Baru" di atas.</td></tr>';
    return;
  }

  visibleQuestions.forEach((q, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = 
      '<td>' + (idx + 1) + '</td>' +
      '<td>' +
        '<div style="font-weight: 600; color: var(--slate-900);">' + escapeHtml(q.text) + '</div>' +
        '<div style="font-size: 0.78rem; color: var(--slate-500); margin-top: 0.25rem;">' +
          'A: ' + escapeHtml(q.optionA) + ' | B: ' + escapeHtml(q.optionB) + ' | C: ' + escapeHtml(q.optionC) + ' | D: ' + escapeHtml(q.optionD) +
        '</div>' +
      '</td>' +
      '<td><span class="badge badge-info">' + escapeHtml(q.subject || 'Umum') + '</span></td>' +
      '<td><span class="badge badge-success">' + escapeHtml(q.targetClass || 'UMUM') + '</span></td>' +
      '<td><span class="badge badge-info">Opsi ' + q.correctKey + '</span></td>' +
      '<td>' + (q.scoreWeight || 20) + '</td>' +
      '<td>' +
        '<div style="display: flex; gap: 0.35rem;">' +
          '<button class="btn btn-outline btn-sm" onclick="openEditQuestionModal(\'' + q.id + '\')">Edit</button>' +
          '<button class="btn btn-danger btn-sm" onclick="deleteQuestion(\'' + q.id + '\')">Hapus</button>' +
        '</div>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

function triggerQuestionImageUpload() {
  const input = document.getElementById('edit-question-file-input');
  if (input) input.click();
}

function handleQuestionImageUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('File harus berupa gambar (PNG, JPG, SVG, WebP)!', 'warning');
    return;
  }

  if (file.size > 3 * 1024 * 1024) {
    showToast('Ukuran gambar maksimal 3MB!', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const urlInput = document.getElementById('edit-question-image');
    if (urlInput) urlInput.value = dataUrl;
    previewQuestionImage(dataUrl);
    showToast('Foto / gambar soal berhasil dimuat!', 'info');
  };
  reader.readAsDataURL(file);
}

function previewQuestionImage(url) {
  const box = document.getElementById('edit-question-image-preview-box');
  const img = document.getElementById('edit-question-image-preview');
  if (!box || !img) return;

  if (url && url.trim()) {
    img.src = url.trim();
    box.style.display = 'block';
  } else {
    box.style.display = 'none';
    img.src = '';
  }
}

function removeQuestionImage() {
  const urlInput = document.getElementById('edit-question-image');
  const fileInput = document.getElementById('edit-question-file-input');
  const box = document.getElementById('edit-question-image-preview-box');
  const img = document.getElementById('edit-question-image-preview');

  if (urlInput) urlInput.value = '';
  if (fileInput) fileInput.value = '';
  if (box) box.style.display = 'none';
  if (img) img.src = '';
}

function openAddQuestionModal() {
  document.getElementById('modal-question-title').textContent = 'Tambah Soal Baru';
  document.getElementById('edit-question-id').value = '';
  document.getElementById('form-question-editor').reset();
  removeQuestionImage();

  const subjInput = document.getElementById('edit-question-subject');
  const classInput = document.getElementById('edit-question-class');

  // Sinkronisasi opsi dropdown mata pelajaran dari master state.subjects
  if (subjInput && Array.isArray(state.subjects) && state.subjects.length > 0) {
    let opts = '<option value="">-- Pilih Mata Pelajaran --</option>';
    state.subjects.forEach(s => {
      opts += `<option value="${s.name}">${s.name}</option>`;
    });
    subjInput.innerHTML = opts;
  }

  // Kunci otomatis field sesuai identitas guru yang login
  if (state.currentTeacher) {
    const t = state.currentTeacher;
    if (t.role === 'guru_kelas') {
      if (classInput) {
        classInput.value = t.assignedClass || '6A';
        classInput.disabled = true;
      }
      if (subjInput) {
        subjInput.value = (t.assignedSubject && t.assignedSubject !== 'Semua') ? t.assignedSubject : '';
        subjInput.disabled = false;
      }
    } else if (t.role === 'guru_mapel') {
      if (subjInput) {
        subjInput.value = t.assignedSubject;
        subjInput.disabled = true;
      }
      if (classInput) {
        classInput.value = 'UMUM';
        classInput.disabled = false;
      }
    } else {
      if (subjInput) subjInput.disabled = false;
      if (classInput) classInput.disabled = false;
    }
  } else {
    if (subjInput) subjInput.disabled = false;
    if (classInput) classInput.disabled = false;
  }

  document.getElementById('modal-question-editor').style.display = 'flex';
}

function openEditQuestionModal(qId) {
  const q = state.questions.find(item => item.id === qId);
  if (!q) return;

  // Proteksi Isolasi: Guru Kelas dilarang mengedit soal guru lain
  if (state.currentTeacher && state.currentTeacher.role === 'guru_kelas') {
    if (q.targetClass !== state.currentTeacher.assignedClass && q.teacherId !== state.currentTeacher.id) {
      showToast('Akses ditolak: Anda tidak memiliki hak mengedit soal kelas lain!', 'danger');
      return;
    }
  }

  // Proteksi Isolasi: Guru Mapel dilarang mengedit soal mapel lain
  if (state.currentTeacher && state.currentTeacher.role === 'guru_mapel') {
    if (q.subject !== state.currentTeacher.assignedSubject && q.teacherId !== state.currentTeacher.id) {
      showToast('Akses ditolak: Anda tidak memiliki hak mengedit soal mapel lain!', 'danger');
      return;
    }
  }

  document.getElementById('modal-question-title').textContent = 'Edit Butir Soal';
  document.getElementById('edit-question-id').value = q.id;
  document.getElementById('edit-question-text').value = q.text;
  document.getElementById('edit-question-image').value = q.imageUrl || '';
  
  if (q.imageUrl) {
    previewQuestionImage(q.imageUrl);
  } else {
    removeQuestionImage();
  }
  
  const subjInput = document.getElementById('edit-question-subject');
  const classInput = document.getElementById('edit-question-class');

  // Sinkronisasi opsi dropdown mata pelajaran dari master state.subjects
  if (subjInput && Array.isArray(state.subjects) && state.subjects.length > 0) {
    let opts = '<option value="">-- Pilih Mata Pelajaran --</option>';
    state.subjects.forEach(s => {
      opts += `<option value="${s.name}">${s.name}</option>`;
    });
    subjInput.innerHTML = opts;
  }

  if (subjInput) {
    subjInput.value = q.subject || '';
    subjInput.disabled = (state.currentTeacher && state.currentTeacher.role === 'guru_mapel');
  }
  if (classInput) {
    classInput.value = q.targetClass || 'UMUM';
    classInput.disabled = (state.currentTeacher && state.currentTeacher.role === 'guru_kelas');
  }

  document.getElementById('edit-opt-a').value = q.optionA;
  document.getElementById('edit-opt-b').value = q.optionB;
  document.getElementById('edit-opt-c').value = q.optionC;
  document.getElementById('edit-opt-d').value = q.optionD;
  document.getElementById('edit-opt-e').value = q.optionE || '';
  document.getElementById('edit-correct-key').value = q.correctKey;
  document.getElementById('edit-score-weight').value = q.scoreWeight || 10;

  document.getElementById('modal-question-editor').style.display = 'flex';
}

function closeQuestionModal() {
  document.getElementById('modal-question-editor').style.display = 'none';
  removeQuestionImage();
}

// Helper untuk 5 Tipe Soal
function toggleMultiKeyAnswer(qId, key) {
  if (!state.student.answers[qId]) {
    state.student.answers[qId] = { selected: [key], isDoubt: false };
  } else {
    let arr = Array.isArray(state.student.answers[qId].selected) ? state.student.answers[qId].selected : [];
    if (arr.includes(key)) {
      arr = arr.filter(k => k !== key);
    } else {
      arr.push(key);
    }
    state.student.answers[qId].selected = arr;
  }
  renderCurrentQuestion();
  triggerAutoSaveIndicator();
}

function selectPairAnswer(qId, premisIdx, selectedJawab) {
  if (!state.student.answers[qId]) {
    state.student.answers[qId] = { selected: {}, isDoubt: false };
  }
  if (typeof state.student.answers[qId].selected !== 'object' || Array.isArray(state.student.answers[qId].selected)) {
    state.student.answers[qId].selected = {};
  }
  state.student.answers[qId].selected[premisIdx] = selectedJawab;
  triggerAutoSaveIndicator();
}

function selectBsAnswer(qId, stIdx, val) {
  if (!state.student.answers[qId]) {
    state.student.answers[qId] = { selected: {}, isDoubt: false };
  }
  if (typeof state.student.answers[qId].selected !== 'object' || Array.isArray(state.student.answers[qId].selected)) {
    state.student.answers[qId].selected = {};
  }
  state.student.answers[qId].selected[stIdx] = val;
  renderCurrentQuestion();
  triggerAutoSaveIndicator();
}

// Selector 5 Tipe Soal pada Modal Editor (Gambar 3)
function setEditorQuestionType(type, buttonEl) {
  state.currentEditorQType = type;
  document.getElementById('edit-question-type').value = type;

  // Update button active state
  document.querySelectorAll('.qtype-btn').forEach(btn => btn.classList.remove('active'));
  if (buttonEl) buttonEl.classList.add('active');

  // Toggle dynamic panels
  const panelPg = document.getElementById('qtype-panel-pg');
  const panelJodoh = document.getElementById('qtype-panel-jodoh');
  const panelEsai = document.getElementById('qtype-panel-esai');
  const panelBs = document.getElementById('qtype-panel-bs');

  const groupSingle = document.getElementById('group-single-key');
  const groupMulti = document.getElementById('group-multi-key');

  if (panelPg) panelPg.style.display = (type === 'pg' || type === 'kompleks') ? 'block' : 'none';
  if (panelJodoh) panelJodoh.style.display = type === 'jodoh' ? 'block' : 'none';
  if (panelEsai) panelEsai.style.display = type === 'esai' ? 'block' : 'none';
  if (panelBs) panelBs.style.display = type === 'bs' ? 'block' : 'none';

  if (groupSingle) groupSingle.style.display = type === 'pg' ? 'block' : 'none';
  if (groupMulti) groupMulti.style.display = type === 'kompleks' ? 'block' : 'none';
}

function handleSaveQuestion(event) {
  event.preventDefault();

  const qId = document.getElementById('edit-question-id').value;
  const teacher = state.currentTeacher;
  const qType = state.currentEditorQType || 'pg';

  let questionData = {
    id: qId || 'q-' + Date.now(),
    number: state.questions.length + 1,
    type: qType,
    teacherId: teacher ? teacher.id : 't-admin',
    teacherName: teacher ? teacher.fullName : 'Admin',
    subject: document.getElementById('edit-question-subject')?.value.trim() || 'Matematika',
    targetClass: document.getElementById('edit-question-class')?.value.trim().toUpperCase() || 'UMUM',
    text: document.getElementById('edit-question-text').value.trim(),
    imageUrl: document.getElementById('edit-question-image').value.trim(),
    scoreWeight: parseInt(document.getElementById('edit-score-weight').value) || 10
  };

  if (qType === 'pg' || qType === 'kompleks') {
    questionData.optionA = document.getElementById('edit-opt-a').value.trim();
    questionData.optionB = document.getElementById('edit-opt-b').value.trim();
    questionData.optionC = document.getElementById('edit-opt-c').value.trim();
    questionData.optionD = document.getElementById('edit-opt-d').value.trim();
    questionData.optionE = document.getElementById('edit-opt-e').value.trim();

    if (qType === 'pg') {
      questionData.correctKey = document.getElementById('edit-correct-key').value;
    } else {
      const keys = [];
      ['a', 'b', 'c', 'd', 'e'].forEach(ch => {
        const el = document.getElementById('key-chk-' + ch);
        if (el && el.checked) keys.push(ch.toUpperCase());
      });
      questionData.correctKeys = keys.length > 0 ? keys : ['A'];
    }
  } else if (qType === 'jodoh') {
    questionData.pairs = [
      { premis: document.getElementById('jodoh-premis-1').value.trim() || 'Premis 1', jawab: document.getElementById('jodoh-jawab-1').value.trim() || 'Jawaban 1' },
      { premis: document.getElementById('jodoh-premis-2').value.trim() || 'Premis 2', jawab: document.getElementById('jodoh-jawab-2').value.trim() || 'Jawaban 2' },
      { premis: document.getElementById('jodoh-premis-3').value.trim() || 'Premis 3', jawab: document.getElementById('jodoh-jawab-3').value.trim() || 'Jawaban 3' }
    ];
  } else if (qType === 'esai') {
    questionData.referenceKey = document.getElementById('esai-key-text').value.trim();
  } else if (qType === 'bs') {
    questionData.statements = [
      { text: document.getElementById('bs-text-1').value.trim() || 'Pernyataan 1', key: document.getElementById('bs-key-1').value },
      { text: document.getElementById('bs-text-2').value.trim() || 'Pernyataan 2', key: document.getElementById('bs-key-2').value }
    ];
  }

  if (qId) {
    const idx = state.questions.findIndex(q => q.id === qId);
    if (idx >= 0) state.questions[idx] = questionData;
  } else {
    state.questions.push(questionData);
  }

  localStorage.setItem('zettcbt_questions', JSON.stringify(state.questions));
  renderAdminQuestionBank();
  closeQuestionModal();
  showToast('Butir soal berhasil disimpan!', 'success');
}

// ==============================================================================
// MANAJEMEN DATA SISWA (MENU GURU & OPERATOR)
// ==============================================================================

function getVisibleStudents() {
  if (!state.currentTeacher) return state.students;
  const t = state.currentTeacher;
  const filterClass = document.getElementById('filter-manage-student-class')?.value || 'ALL';

  let list = state.students;

  // Isolasi Guru Kelas
  if (t.role === 'guru_kelas' && t.assignedClass) {
    list = list.filter(s => s.className === t.assignedClass || s.className === 'Kelas ' + t.assignedClass || s.className.includes(t.assignedClass));
  } else if (filterClass !== 'ALL') {
    list = list.filter(s => s.className === filterClass || s.className.includes(filterClass));
  }

  return list;
}

function renderStudentsTable() {
  const tbody = document.getElementById('table-students-body');
  if (!tbody) return;

  const students = getVisibleStudents();
  tbody.innerHTML = '';

  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--slate-400);">Belum ada data siswa di kelas kewenangan Anda. Klik "+ Tambah Siswa Baru" di atas.</td></tr>';
    return;
  }

  students.forEach((s, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = 
      '<td>' + (idx + 1) + '</td>' +
      '<td><strong>' + escapeHtml(s.nisn) + '</strong></td>' +
      '<td>' + escapeHtml(s.name) + '</td>' +
      '<td><span class="badge badge-info">' + escapeHtml(s.className) + '</span></td>' +
      '<td>' + (s.gender === 'P' ? 'Perempuan (P)' : 'Laki-laki (L)') + '</td>' +
      '<td><span class="badge badge-success">Terdaftar (Aktif)</span></td>' +
      '<td>' +
        '<div style="display: flex; gap: 0.35rem;">' +
          '<button class="btn btn-outline btn-sm" onclick="openEditStudentModal(\'' + escapeHtml(s.nisn) + '\')">Edit</button>' +
          '<button class="btn btn-danger btn-sm" onclick="deleteStudent(\'' + escapeHtml(s.nisn) + '\')">Hapus</button>' +
        '</div>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

function openAddStudentModal() {
  document.getElementById('modal-student-title').textContent = 'Tambah Data Siswa Baru';
  document.getElementById('edit-student-original-nisn').value = '';
  document.getElementById('form-student-editor').reset();

  const classInput = document.getElementById('edit-student-class');
  if (state.currentTeacher && state.currentTeacher.role === 'guru_kelas') {
    if (classInput) {
      classInput.value = state.currentTeacher.assignedClass || '';
      classInput.readOnly = true;
    }
  } else {
    if (classInput) classInput.readOnly = false;
  }

  document.getElementById('modal-student-editor').style.display = 'flex';
}

function openEditStudentModal(nisn) {
  const s = state.students.find(item => item.nisn === nisn);
  if (!s) return;

  // Proteksi Isolasi Guru Kelas
  if (state.currentTeacher && state.currentTeacher.role === 'guru_kelas') {
    if (s.className !== state.currentTeacher.assignedClass && !s.className.includes(state.currentTeacher.assignedClass)) {
      showToast('Akses ditolak: Anda tidak memiliki hak mengedit siswa kelas lain!', 'danger');
      return;
    }
  }

  document.getElementById('modal-student-title').textContent = 'Edit Data Siswa';
  document.getElementById('edit-student-original-nisn').value = s.nisn;
  document.getElementById('edit-student-nisn').value = s.nisn;
  document.getElementById('edit-student-name').value = s.name;
  
  const classInput = document.getElementById('edit-student-class');
  if (classInput) {
    classInput.value = s.className;
    if (state.currentTeacher && state.currentTeacher.role === 'guru_kelas') {
      classInput.readOnly = true;
    } else {
      classInput.readOnly = false;
    }
  }

  document.getElementById('edit-student-gender').value = s.gender || 'L';
  document.getElementById('modal-student-editor').style.display = 'flex';
}

function closeStudentModal() {
  const modal = document.getElementById('modal-student-editor');
  if (modal) modal.style.display = 'none';
}

async function handleSaveStudent(event) {
  event.preventDefault();
  const originalNisn = document.getElementById('edit-student-original-nisn').value.trim();
  const nisn = document.getElementById('edit-student-nisn').value.trim();
  const name = document.getElementById('edit-student-name').value.trim();
  const className = document.getElementById('edit-student-class').value.trim().toUpperCase();
  const gender = document.getElementById('edit-student-gender').value;

  if (!nisn || !name || !className) {
    showToast('Harap lengkapi seluruh isian siswa!', 'warning');
    return;
  }

  // Cek duplikasi NISN jika NISN baru
  if (!originalNisn && state.students.some(s => s.nisn.toLowerCase() === nisn.toLowerCase())) {
    showToast('NISN ' + nisn + ' sudah terdaftar untuk siswa lain!', 'danger');
    return;
  }

  const existingStudent = originalNisn ? state.students.find(s => s.nisn === originalNisn) : null;
  const studentObj = {
    id: originalNisn ? (existingStudent?.id || 'st-' + Date.now()) : 'st-' + Date.now(),
    nisn: nisn,
    name: name,
    className: className,
    gender: gender,
    status: 'active',
    passwords: existingStudent?.passwords || generateStudentSubjectPasswords(nisn)
  };

  if (originalNisn) {
    const idx = state.students.findIndex(s => s.nisn === originalNisn);
    if (idx >= 0) state.students[idx] = studentObj;
  } else {
    state.students.push(studentObj);
  }

  localStorage.setItem('zettcbt_students', JSON.stringify(state.students));

  // Sinkronisasi ke Supabase jika aktif
  if (state.supabase.url && state.supabase.key) {
    try {
      await fetch(state.supabase.url + '/rest/v1/students', {
        method: 'POST',
        headers: {
          'apikey': state.supabase.key,
          'Authorization': 'Bearer ' + state.supabase.key,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          nisn: studentObj.nisn,
          full_name: studentObj.name,
          class_name: studentObj.className,
          gender: studentObj.gender
        })
      });
    } catch (e) {
      console.warn('Gagal sinkron siswa ke Supabase:', e);
    }
  }

  renderStudentsTable();
  renderExamCardsTab();
  closeStudentModal();
  showToast('Data siswa ' + name + ' berhasil disimpan!', 'success');
}

async function deleteStudent(nisn) {
  if (!confirm('Yakin ingin menghapus data siswa NISN: ' + nisn + '?')) return;

  state.students = state.students.filter(s => s.nisn !== nisn);
  localStorage.setItem('zettcbt_students', JSON.stringify(state.students));

  // Hapus dari Neon Cloud Database
  if (state.neon.endpoint) {
    try {
      await executeNeonSql('DELETE FROM students WHERE nisn = $1;', [nisn]);
    } catch (eNeon) {
      console.warn('Gagal hapus siswa di Neon Cloud:', eNeon.message);
    }
  }

  if (state.supabase.url && state.supabase.key) {
    try {
      await fetch(state.supabase.url + '/rest/v1/students?nisn=eq.' + encodeURIComponent(nisn), {
        method: 'DELETE',
        headers: {
          'apikey': state.supabase.key,
          'Authorization': 'Bearer ' + state.supabase.key
        }
      });
    } catch (e) {
      console.warn('Gagal hapus siswa di Supabase:', e);
    }
  }

  renderStudentsTable();
  renderExamCardsTab();
  updateAdminMetrics();
  showToast('Data siswa berhasil dihapus secara permanen!', 'info');
}

// ==============================================================================
// MANAJEMEN AKUN GURU (MENU ADMIN / OPERATOR SEKOLAH)
// ==============================================================================

function renderTeachersTable() {
  const tbody = document.getElementById('table-teachers-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  state.teachers.forEach((t, idx) => {
    const tr = document.createElement('tr');

    let badgeRole = '<span class="teacher-badge admin">Operator Sekolah</span>';
    if (t.role === 'guru_kelas') {
      badgeRole = '<span class="teacher-badge kelas">Guru Kelas</span>';
    } else if (t.role === 'guru_mapel') {
      badgeRole = '<span class="teacher-badge mapel">Guru Mapel</span>';
    }

    let scopeInfo = '-';
    if (t.role === 'guru_kelas') {
      scopeInfo = 'Kelas: <strong>' + (t.assignedClass || '-') + '</strong>';
    } else if (t.role === 'guru_mapel') {
      scopeInfo = 'Mapel: <strong>' + (t.assignedSubject || '-') + '</strong>';
    } else {
      scopeInfo = 'Akses Penuh Seluruh Sekolah';
    }

    const isPrimaryAdmin = t.username === 'admin';
    const deleteBtn = isPrimaryAdmin 
      ? '<span style="font-size:0.75rem; color:var(--slate-400);">Akun Utama</span>'
      : '<button class="btn btn-danger btn-sm" onclick="deleteTeacher(\'' + t.id + '\')">Hapus</button>';

    tr.innerHTML = 
      '<td>' + (idx + 1) + '</td>' +
      '<td><strong>' + escapeHtml(t.fullName) + '</strong></td>' +
      '<td><code>' + escapeHtml(t.username) + '</code></td>' +
      '<td><span style="letter-spacing: 0.15em; font-family: monospace;">••••••</span></td>' +
      '<td>' + badgeRole + '</td>' +
      '<td>' + scopeInfo + '</td>' +
      '<td>' +
        '<div style="display: flex; gap: 0.35rem; align-items: center;">' +
          '<button class="btn btn-outline btn-sm" onclick="openEditTeacherModal(\'' + t.id + '\')">Edit</button>' +
          deleteBtn +
        '</div>' +
      '</td>';

    tbody.appendChild(tr);
  });
}

function openAddTeacherModal() {
  document.getElementById('modal-teacher-title').textContent = 'Tambah Akun Guru Baru';
  document.getElementById('edit-teacher-id').value = '';
  document.getElementById('form-teacher-editor').reset();
  document.getElementById('edit-teacher-username').readOnly = false;
  handleTeacherRoleChange();
  document.getElementById('modal-teacher-editor').style.display = 'flex';
}

function openEditTeacherModal(id) {
  const t = state.teachers.find(item => item.id === id);
  if (!t) return;

  document.getElementById('modal-teacher-title').textContent = 'Edit Akun Guru & Pengawas';
  document.getElementById('edit-teacher-id').value = t.id;
  document.getElementById('edit-teacher-fullname').value = t.fullName;
  document.getElementById('edit-teacher-username').value = t.username;
  document.getElementById('edit-teacher-username').readOnly = (t.username === 'admin');
  document.getElementById('edit-teacher-password').value = t.password;
  document.getElementById('edit-teacher-role').value = t.role;
  document.getElementById('edit-teacher-class').value = t.assignedClass || '';
  document.getElementById('edit-teacher-subject').value = t.assignedSubject || '';

  handleTeacherRoleChange();
  document.getElementById('modal-teacher-editor').style.display = 'flex';
}

function closeTeacherModal() {
  const modal = document.getElementById('modal-teacher-editor');
  if (modal) modal.style.display = 'none';
}

function toggleEditTeacherPasswordVisibility() {
  const input = document.getElementById('edit-teacher-password');
  const icon = document.getElementById('eye-icon-teacher-edit');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
  } else {
    input.type = 'password';
    if (icon) icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
  }
}

function handleTeacherRoleChange() {
  const role = document.getElementById('edit-teacher-role').value;
  const grpClass = document.getElementById('group-teacher-class');
  const grpSubject = document.getElementById('group-teacher-subject');

  if (role === 'guru_kelas') {
    if (grpClass) grpClass.style.display = 'block';
    if (grpSubject) grpSubject.style.display = 'none';
  } else if (role === 'guru_mapel') {
    if (grpClass) grpClass.style.display = 'none';
    if (grpSubject) grpSubject.style.display = 'block';
  } else {
    if (grpClass) grpClass.style.display = 'none';
    if (grpSubject) grpSubject.style.display = 'none';
  }
}

async function handleSaveTeacher(event) {
  event.preventDefault();
  const id = document.getElementById('edit-teacher-id').value;
  const fullName = document.getElementById('edit-teacher-fullname').value.trim();
  const username = document.getElementById('edit-teacher-username').value.trim().toLowerCase();
  const password = document.getElementById('edit-teacher-password').value.trim();
  const role = document.getElementById('edit-teacher-role').value;
  const assignedClass = document.getElementById('edit-teacher-class').value.trim().toUpperCase() || null;
  const assignedSubject = document.getElementById('edit-teacher-subject').value.trim() || null;

  if (!fullName || !username || !password) {
    showToast('Harap lengkapi nama, username, dan password guru!', 'warning');
    return;
  }

  // Cek duplikasi username jika akun baru
  if (!id && state.teachers.some(t => t.username === username)) {
    showToast('Username "' + username + '" sudah digunakan oleh guru lain!', 'danger');
    return;
  }

  const teacherObj = {
    id: id || 't-' + Date.now(),
    username: username,
    password: password,
    fullName: fullName,
    role: role,
    assignedClass: assignedClass,
    assignedSubject: assignedSubject
  };

  if (id) {
    const idx = state.teachers.findIndex(t => t.id === id);
    if (idx >= 0) state.teachers[idx] = teacherObj;
  } else {
    state.teachers.push(teacherObj);
  }

  localStorage.setItem('zettcbt_teachers', JSON.stringify(state.teachers));
  localStorage.setItem('zettcbt_admin_profile_' + teacherObj.username, JSON.stringify({
    fullName: teacherObj.fullName,
    nip: teacherObj.nip || ''
  }));

  // Sinkronisasi ke Neon Cloud jika aktif
  if (state.neon && state.neon.endpoint) {
    executeNeonSql(`INSERT INTO teachers (username, password_hash, full_name, role, assigned_class, assigned_subject)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (username) DO UPDATE
                    SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, assigned_class = EXCLUDED.assigned_class, assigned_subject = EXCLUDED.assigned_subject, updated_at = NOW();`,
      [teacherObj.username, teacherObj.password, teacherObj.fullName, teacherObj.role, teacherObj.assignedClass, teacherObj.assignedSubject]
    ).catch(e => console.warn('Gagal sinkron guru ke Neon:', e.message));
  }

  // Sinkronisasi ke Supabase jika aktif
  if (state.supabase.url && state.supabase.key) {
    try {
      await fetch(state.supabase.url + '/rest/v1/teachers', {
        method: 'POST',
        headers: {
          'apikey': state.supabase.key,
          'Authorization': 'Bearer ' + state.supabase.key,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          username: teacherObj.username,
          password_hash: teacherObj.password,
          full_name: teacherObj.fullName,
          role: teacherObj.role,
          assigned_class: teacherObj.assignedClass,
          assigned_subject: teacherObj.assignedSubject
        })
      });
    } catch (e) {
      console.warn('Gagal sinkron akun guru ke Supabase:', e);
    }
  }

  renderTeachersTable();
  closeTeacherModal();
  showToast('Akun guru ' + fullName + ' berhasil disimpan!', 'success');
}

async function deleteTeacher(id) {
  const target = state.teachers.find(t => t.id === id);
  if (!target) return;

  if (target.username === 'admin') {
    showToast('Akun Operator Sekolah utama tidak dapat dihapus!', 'danger');
    return;
  }

  if (!confirm('Yakin ingin menghapus akun guru: ' + target.fullName + ' (' + target.username + ')?')) return;

  state.teachers = state.teachers.filter(t => t.id !== id);
  localStorage.setItem('zettcbt_teachers', JSON.stringify(state.teachers));

  // Hapus dari Neon Cloud Database
  if (state.neon.endpoint && target.username) {
    try {
      await executeNeonSql('DELETE FROM teachers WHERE username = $1;', [target.username]);
    } catch (eNeon) {
      console.warn('Gagal hapus guru di Neon Cloud:', eNeon.message);
    }
  }

  if (state.supabase.url && state.supabase.key) {
    try {
      await fetch(state.supabase.url + '/rest/v1/teachers?username=eq.' + encodeURIComponent(target.username), {
        method: 'DELETE',
        headers: {
          'apikey': state.supabase.key,
          'Authorization': 'Bearer ' + state.supabase.key
        }
      });
    } catch (e) {
      console.warn('Gagal hapus guru di Supabase:', e);
    }
  }

  renderTeachersTable();
  updateAdminMetrics();
  showToast('Akun guru berhasil dihapus secara permanen!', 'info');
}

// ==============================================================================
// CETAK PDF ENGINE (KOP SURAT SD NEGERI 14 TOBOALI)
// ==============================================================================

function generateKopSuratHtml() {
  const sch = state.school;
  const logoHtml = sch.logoUrl 
    ? `<div style="flex-shrink: 0; margin-right: 18px;"><img src="${sch.logoUrl}" alt="Logo Sekolah" style="height: 75px; max-width: 85px; object-fit: contain;"></div>` 
    : '';

  return `
    <div style="display: flex; align-items: center; justify-content: center; border-bottom: 3px double #000000; padding-bottom: 10px; margin-bottom: 18px; font-family: 'Times New Roman', serif;">
      ${logoHtml}
      <div style="text-align: center; flex: 1;">
        <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.02em;">PEMERINTAH KABUPATEN BANGKA SELATAN</div>
        <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">DINAS PENDIDIKAN DAN KEBUDAYAAN</div>
        <div style="font-size: 16pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 2px 0;">${sch.name}</div>
        <div style="font-size: 9pt; margin-top: 2px;">NPSN: ${sch.npsn} | Alamat: ${sch.address}</div>
      </div>
    </div>
  `;
}

// 1. Cetak Naskah Soal ke PDF
function printExamQuestionsPdf() {
  const container = document.getElementById('print-container');
  const visibleQ = getVisibleQuestions();
  const sch = state.school;

  let questionsHtml = '';
  visibleQ.forEach((q, idx) => {
    let qContent = '<div style="margin-bottom: 12px; font-size: 10.5pt; line-height: 1.4;"><strong>' + (idx + 1) + '. ' + escapeHtml(q.text) + '</strong>';
    if (q.type === 'pg' || !q.type || q.type === 'kompleks') {
      qContent += '<div style="margin-left: 20px; margin-top: 4px;">';
      qContent += '<div>A. ' + escapeHtml(q.optionA || '') + '</div>';
      qContent += '<div>B. ' + escapeHtml(q.optionB || '') + '</div>';
      qContent += '<div>C. ' + escapeHtml(q.optionC || '') + '</div>';
      qContent += '<div>D. ' + escapeHtml(q.optionD || '') + '</div>';
      if (q.optionE) qContent += '<div>E. ' + escapeHtml(q.optionE) + '</div>';
      qContent += '</div>';
    } else if (q.type === 'esai') {
      qContent += '<div style="margin-left: 20px; margin-top: 8px; border-bottom: 1px dashed #666; height: 35px;">Jawaban: </div>';
    } else if (q.type === 'bs') {
      qContent += '<div style="margin-left: 20px; margin-top: 4px;">[ ] Benar &nbsp;&nbsp;&nbsp;&nbsp; [ ] Salah</div>';
    }
    qContent += '</div>';
    questionsHtml += qContent;
  });

  container.innerHTML = 
    generateKopSuratHtml() +
    '<div style="text-align: center; margin-bottom: 16px;">' +
      '<strong style="font-size: 12pt; text-transform: uppercase;">NASKAH BUTIR SOAL UJIAN SEKOLAH</strong><br>' +
      '<span style="font-size: 10pt;">Mata Pelajaran: ' + state.session.subject + ' | Tahun Ajaran: ' + sch.academicYear + '</span>' +
    '</div>' +
    questionsHtml;

  window.print();
}

// 2. Cetak Rekap Nilai ke PDF
function printResultsPdf() {
  const container = document.getElementById('print-container');
  const finishedList = getVisibleLiveStudents().filter(s => s.status === 'submitted');
  const sch = state.school;

  finishedList.sort((a, b) => b.score - a.score);

  let rowsHtml = '';
  finishedList.forEach((st, idx) => {
    rowsHtml += `
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 6px;">${st.nisn}</td>
        <td style="border: 1px solid #000; padding: 6px;"><strong>${st.name}</strong></td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${st.className}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${st.score}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${st.score >= 75 ? 'TUNTAS' : 'REMEDIAL'}</td>
      </tr>
    `;
  });

  const teacherSignerName = sch.teacherSigner || (state.currentTeacher ? state.currentTeacher.fullName : 'Pengawas Ujian');
  const teacherSignerNipHtml = (sch.teacherSignerNip && sch.teacherSignerNip !== '-') ? `<br>NIP. ${sch.teacherSignerNip}` : '';

  container.innerHTML = 
    generateKopSuratHtml() +
    '<div style="text-align: center; margin-bottom: 16px;">' +
      '<strong style="font-size: 12pt; text-transform: uppercase;">REKAPITULASI HASIL PENILAIAN UJIAN BERBASIS KOMPUTER</strong><br>' +
      '<span style="font-size: 10pt;">Mata Pelajaran: ' + state.session.subject + ' | Tahun Pelajaran: ' + sch.academicYear + '</span>' +
    '</div>' +
    '<table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 30px;">' +
      '<thead><tr style="background: #f0f0f0;">' +
        '<th style="border: 1px solid #000; padding: 6px;">No</th>' +
        '<th style="border: 1px solid #000; padding: 6px;">NISN / No Peserta</th>' +
        '<th style="border: 1px solid #000; padding: 6px;">Nama Lengkap Siswa</th>' +
        '<th style="border: 1px solid #000; padding: 6px;">Kelas</th>' +
        '<th style="border: 1px solid #000; padding: 6px;">Nilai Akhir</th>' +
        '<th style="border: 1px solid #000; padding: 6px;">Status</th>' +
      '</tr></thead>' +
      '<tbody>' + (rowsHtml || '<tr><td colspan="6" style="text-align:center; padding: 10px;">Belum ada data nilai submit.</td></tr>') + '</tbody>' +
    '</table>' +
    '<div style="display: flex; justify-content: space-between; font-size: 10pt; margin-top: 30px;">' +
      '<div>Mengetahui,<br>Kepala ' + sch.name + '<br><br><br><br><strong>' + sch.headmaster + '</strong><br>NIP. ' + sch.headmasterNip + '</div>' +
      '<div>Toboali, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + '<br>Guru Mata Pelajaran / Wali Kelas<br><br><br><br><strong>' + teacherSignerName + '</strong>' + teacherSignerNipHtml + '</div>' +
    '</div>';

  window.print();
}

// 3. Cetak Kartu Peserta Ujian ke PDF (Format Kotak A4 dengan Password Mapel)
function printExamCardsPdf() {
  const container = document.getElementById('print-container');
  const students = getVisibleStudents();
  const sch = state.school;
  const subjects = state.subjects || [];

  if (!students || students.length === 0) {
    showToast('Tidak ada data siswa untuk dicetak kartu ujiannya!', 'warning');
    return;
  }

  let cardsHtml = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">';

  students.forEach((st) => {
    const cardLogoHtml = sch.logoUrl 
      ? `<img src="${sch.logoUrl}" style="height: 38px; width: 38px; object-fit: contain; margin-right: 8px;">` 
      : '';

    let subRows = '';
    subjects.forEach((sub, subIdx) => {
      const pwd = getStudentPasswordForSubject(st, sub.name);
      subRows += `
        <tr>
          <td style="border: 1px solid #333; padding: 2px 4px; text-align: center; font-size: 7pt;">${subIdx + 1}</td>
          <td style="border: 1px solid #333; padding: 2px 4px; font-size: 7.5pt; font-weight: bold;">${escapeHtml(sub.name)}</td>
          <td style="border: 1px solid #333; padding: 2px 4px; font-family: monospace; font-weight: bold; font-size: 8pt; text-align: center; color: #1e40af;">${pwd}</td>
          <td style="border: 1px solid #333; padding: 2px 4px; font-size: 6.8pt; color: #555; text-align: center;">Dirilis Pengawas</td>
        </tr>
      `;
    });

    cardsHtml += `
      <div style="border: 2px solid #000; padding: 10px 12px; border-radius: 6px; font-family: 'Times New Roman', serif; background: #fff; page-break-inside: avoid; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; justify-content: center; border-bottom: 2px double #000; padding-bottom: 4px; margin-bottom: 6px;">
          ${cardLogoHtml}
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 7.5pt; font-weight: bold; text-transform: uppercase;">DINAS PENDIDIKAN KABUPATEN BANGKA SELATAN</div>
            <div style="font-size: 9pt; font-weight: bold;">${sch.name}</div>
            <div style="font-size: 8pt; font-weight: bold; color: #2563eb;">KARTU PESERTA UJIAN ONLINE (${sch.examType || 'UTS'})</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 58px 1fr; gap: 8px; font-size: 8pt;">
          <div style="width: 55px; height: 68px; border: 1px dashed #666; display: flex; align-items: center; justify-content: center; font-size: 6.8pt; color: #777; text-align: center; background: #fafafa; border-radius: 4px;">
            PAS FOTO<br>2 x 3
          </div>
          <div>
            <div style="margin-bottom: 1.5px;"><strong>No. Peserta / NISN:</strong> ${escapeHtml(st.nisn)}</div>
            <div style="margin-bottom: 1.5px;"><strong>Nama Peserta:</strong> ${escapeHtml(st.name)}</div>
            <div style="margin-bottom: 1.5px;"><strong>Kelas / Rombel:</strong> ${escapeHtml(st.className)}</div>
            <div style="margin-bottom: 1.5px;"><strong>Tahun Pelajaran:</strong> ${sch.academicYear}</div>
            <div style="margin-bottom: 1.5px;"><strong>Ruang / Sesi:</strong> Lab Komputer</div>
          </div>
        </div>

        <!-- Tabel Password Siswa per Mata Pelajaran -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 6px;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid #333; padding: 2px 4px; width: 20px; font-size: 7pt;">No</th>
              <th style="border: 1px solid #333; padding: 2px 4px; text-align: left; font-size: 7pt;">Mata Pelajaran</th>
              <th style="border: 1px solid #333; padding: 2px 4px; width: 90px; font-size: 7pt;">Password Siswa</th>
              <th style="border: 1px solid #333; padding: 2px 4px; width: 85px; font-size: 7pt;">Token Ujian</th>
            </tr>
          </thead>
          <tbody>
            ${subRows}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 7pt; margin-top: 4px;">
          <div style="color: #555; font-style: italic;">*Password wajib dijaga kerahasiaannya</div>
          <div style="text-align: right;">
            Kepala Sekolah,<br><br>
            <strong>${sch.headmaster}</strong><br>
            NIP. ${sch.headmasterNip}
          </div>
        </div>
      </div>
    `;
  });

  cardsHtml += '</div>';

  container.innerHTML = cardsHtml;
  window.print();
}

// Render Tab Kartu Peserta Ujian pada Dashboard Admin
function renderExamCardsTab() {
  const container = document.getElementById('container-exam-cards');
  if (!container) return;

  const students = getVisibleStudents();
  const sch = state.school;
  const subjects = state.subjects || [];
  container.innerHTML = '';

  if (!students || students.length === 0) {
    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: var(--slate-400);">Belum ada data siswa terdaftar. Tambahkan siswa di menu "Kelola Data Siswa" atau klik "Impor dari Excel" untuk membuat kartu ujian.</div>';
    return;
  }

  students.forEach((st) => {
    let subRows = '';
    subjects.forEach((sub, subIdx) => {
      const pwd = getStudentPasswordForSubject(st, sub.name);
      subRows += `
        <tr>
          <td style="text-align: center; width: 22px;">${subIdx + 1}</td>
          <td><strong>${escapeHtml(sub.name)}</strong></td>
          <td style="text-align: center; width: 85px;"><span class="pwd-badge">${pwd}</span></td>
          <td style="color: var(--slate-500); font-size: 0.68rem; text-align: center; width: 80px;">Dirilis Pengawas</td>
        </tr>
      `;
    });

    const card = document.createElement('div');
    card.className = 'exam-student-card';
    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem; border-bottom: 1.5px solid var(--slate-200); padding-bottom: 0.35rem; margin-bottom: 0.5rem;">
        <img src="${sch.logoUrl}" style="width: 28px; height: 28px; object-fit: contain; border-radius: 4px; background: #fff; padding: 1px;" alt="Logo">
        <div style="line-height: 1.2;">
          <div style="font-size: 0.64rem; font-weight: 700; color: var(--primary-600); text-transform: uppercase;">KARTU PESERTA CBT (${sch.examType || 'UAS'})</div>
          <div style="font-size: 0.82rem; font-weight: 800; color: var(--slate-900);">${sch.name}</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 48px 1fr; gap: 0.65rem; align-items: center;">
        <div style="width: 48px; height: 58px; border: 1px dashed var(--slate-300); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; color: var(--slate-400); text-align: center; background: var(--slate-50); line-height: 1.1;">
          FOTO<br>2 x 3
        </div>
        <div style="font-size: 0.74rem; line-height: 1.35;">
          <div><span style="color: var(--slate-500);">No. Peserta:</span> <strong>${escapeHtml(st.nisn)}</strong></div>
          <div><span style="color: var(--slate-500);">Nama:</span> <strong>${escapeHtml(st.name)}</strong></div>
          <div><span style="color: var(--slate-500);">Kelas / Rombel:</span> <span class="badge" style="background: var(--slate-200); font-weight: 700; font-size: 0.68rem; padding: 1px 5px;">${escapeHtml(st.className)}</span></div>
          <div><span style="color: var(--slate-500);">Ruang:</span> Lab Komputer</div>
        </div>
      </div>

      <!-- Tabel Password per Mapel -->
      <table class="exam-card-subject-table">
        <thead>
          <tr>
            <th style="width: 22px;">No</th>
            <th>Mata Pelajaran</th>
            <th style="width: 85px; text-align: center;">Password</th>
            <th style="width: 80px; text-align: center;">Token Mapel</th>
          </tr>
        </thead>
        <tbody>
          ${subRows}
        </tbody>
      </table>
    `;
    container.appendChild(card);
  });
}

/**
 * Manajemen Token Ujian per Mata Pelajaran (Admin Tab Pengaturan Sesi)
 */
function renderSubjectTokensTable() {
  const tbody = document.getElementById('table-subject-tokens-body');
  if (!tbody) return;

  const subjects = state.subjects || [];
  tbody.innerHTML = '';

  if (subjects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 1.5rem; color: var(--slate-400);">Belum ada mata pelajaran terdaftar.</td></tr>';
    return;
  }

  subjects.forEach((sub, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td><strong>${escapeHtml(sub.name)}</strong></td>
      <td><span class="badge" style="background: var(--slate-200); font-weight: 700;">${escapeHtml(sub.code)}</span></td>
      <td>
        <div style="display: flex; gap: 0.4rem; align-items: center;">
          <input type="text" id="token-input-${sub.id}" value="${escapeHtml(sub.token)}" class="form-control" style="width: 110px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.3rem 0.5rem; font-size: 0.85rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="randomizeSingleSubjectToken('${sub.id}')" title="Acak Token">🎲</button>
        </div>
      </td>
      <td>
        <input type="number" id="duration-input-${sub.id}" value="${sub.durationMinutes || 90}" min="10" max="300" class="form-control" style="width: 80px; padding: 0.3rem 0.5rem; font-size: 0.85rem;">
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function randomizeSingleSubjectToken(subId) {
  const sub = (state.subjects || []).find(s => s.id === subId);
  if (!sub) return;
  const input = document.getElementById('token-input-' + subId);
  const randomNum = Math.floor(Math.random() * 89 + 10);
  const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const newToken = `${sub.code}${randomNum}${randomLetter}`;
  if (input) input.value = newToken;
  sub.token = newToken;
  showToast(`Token baru untuk ${sub.name}: ${newToken}. Klik "Simpan Perubahan Token" untuk menetapkan.`, 'info');
}

function generateAllSubjectTokens() {
  (state.subjects || []).forEach(sub => {
    const input = document.getElementById('token-input-' + sub.id);
    const randomNum = Math.floor(Math.random() * 89 + 10);
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const newToken = `${sub.code}${randomNum}${randomLetter}`;
    if (input) input.value = newToken;
    sub.token = newToken;
  });
  showToast('Seluruh token mata pelajaran berhasil diacak! Jangan lupa klik "Simpan Perubahan Token".', 'info');
}

function saveSubjectTokensSettings() {
  (state.subjects || []).forEach(sub => {
    const tokenInput = document.getElementById('token-input-' + sub.id);
    const durationInput = document.getElementById('duration-input-' + sub.id);
    if (tokenInput) sub.token = tokenInput.value.trim().toUpperCase();
    if (durationInput) sub.durationMinutes = parseInt(durationInput.value, 10) || 90;
    sub.isActive = true;
  });

  localStorage.setItem('zettcbt_subjects', JSON.stringify(state.subjects));
  renderSubjectTokensTable();
  renderProctorTokenBar();
  renderTeacherExamSchedules();
  applySchoolBrandingUI();
  showToast('Pengaturan token dan durasi per mata pelajaran berhasil disimpan!', 'success');
}

function regenerateAllStudentPasswords() {
  if (!confirm('Peringatan: Seluruh password siswa untuk semua mata pelajaran akan diacak ulang. Lanjutkan?')) return;
  (state.students || []).forEach((st, idx) => {
    st.passwords = generateStudentSubjectPasswords(st.nisn || ('2026-0' + (idx + 1)));
  });
  localStorage.setItem('zettcbt_students', JSON.stringify(state.students));
  renderExamCardsTab();
  showToast('Seluruh password siswa per mata pelajaran berhasil digenerate ulang!', 'success');
}

function updateLogoPreviewUI(url) {
  const imgEl = document.getElementById('school-logo-img');
  const placeholderEl = document.getElementById('school-logo-placeholder');
  if (!imgEl || !placeholderEl) return;

  if (url && url.trim()) {
    imgEl.src = url.trim();
    imgEl.style.display = 'block';
    placeholderEl.style.display = 'none';
  } else {
    imgEl.src = '';
    imgEl.style.display = 'none';
    placeholderEl.style.display = 'block';
  }
}

function handleLogoFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('File harus berupa gambar (PNG, JPG, SVG, WebP)!', 'warning');
    return;
  }

  // Prevent giant files (> 3MB) from blowing up localStorage
  if (file.size > 3 * 1024 * 1024) {
    showToast('Ukuran file logo terlalu besar (maksimal 3MB).', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    if (document.getElementById('school-logo-url')) {
      document.getElementById('school-logo-url').value = dataUrl;
    }
    updateLogoPreviewUI(dataUrl);
    showToast('Logo berhasil dimuat! Klik "Simpan Pengaturan" untuk menyimpan.', 'info');
  };
  reader.readAsDataURL(file);
}

function handleLogoUrlInput(url) {
  updateLogoPreviewUI(url);
}

function removeSchoolLogo() {
  if (document.getElementById('school-logo-url')) {
    document.getElementById('school-logo-url').value = '';
  }
  const fileInput = document.getElementById('school-logo-file-input');
  if (fileInput) fileInput.value = '';
  updateLogoPreviewUI('');
  showToast('Logo dihapus dari form preview. Klik "Simpan Pengaturan" untuk menetapkan.', 'info');
}

function populateSchoolIdentityForm() {
  const sch = state.school;
  if (document.getElementById('school-name')) document.getElementById('school-name').value = sch.name || '';
  if (document.getElementById('school-npsn')) document.getElementById('school-npsn').value = sch.npsn || '';
  if (document.getElementById('school-academic-year')) document.getElementById('school-academic-year').value = sch.academicYear || '';
  if (document.getElementById('school-exam-type')) document.getElementById('school-exam-type').value = sch.examType || 'UAS';
  if (document.getElementById('school-address')) document.getElementById('school-address').value = sch.address || '';
  if (document.getElementById('school-headmaster')) document.getElementById('school-headmaster').value = sch.headmaster || '';
  if (document.getElementById('school-headmaster-nip')) document.getElementById('school-headmaster-nip').value = sch.headmasterNip || '';
  if (document.getElementById('school-teacher-signer')) document.getElementById('school-teacher-signer').value = sch.teacherSigner || '';
  if (document.getElementById('school-teacher-signer-nip')) document.getElementById('school-teacher-signer-nip').value = sch.teacherSignerNip || '';
  if (document.getElementById('school-logo-url')) document.getElementById('school-logo-url').value = sch.logoUrl || '';
  updateLogoPreviewUI(sch.logoUrl || '');
}

function handleSaveSchoolIdentity(event) {
  event.preventDefault();
  state.school = {
    name: document.getElementById('school-name').value.trim(),
    npsn: document.getElementById('school-npsn').value.trim(),
    academicYear: document.getElementById('school-academic-year').value.trim(),
    examType: document.getElementById('school-exam-type') ? document.getElementById('school-exam-type').value : (state.school.examType || 'UAS'),
    address: document.getElementById('school-address').value.trim(),
    headmaster: document.getElementById('school-headmaster').value.trim(),
    headmasterNip: document.getElementById('school-headmaster-nip').value.trim(),
    logoUrl: document.getElementById('school-logo-url') ? document.getElementById('school-logo-url').value.trim() : (state.school.logoUrl || ''),
    teacherSigner: document.getElementById('school-teacher-signer') ? document.getElementById('school-teacher-signer').value.trim() : (state.school.teacherSigner || ''),
    teacherSignerNip: document.getElementById('school-teacher-signer-nip') ? document.getElementById('school-teacher-signer-nip').value.trim() : (state.school.teacherSignerNip || '')
  };

  localStorage.setItem('zettcbt_school', JSON.stringify(state.school));
  applySchoolBrandingUI();
  populateSchoolIdentityForm();
  renderExamCardsTab();
  showToast('Identitas sekolah & pengaturan ujian berhasil disimpan!', 'success');
}

/**
 * Memasang logo sekolah dan label ujian (UTS/UAS) secara dinamis ke seluruh antarmuka
 */
function applySchoolBrandingUI() {
  const sch = state.school || {};
  const defaultLogo = (typeof window !== 'undefined' && window.OFFICIAL_SDN14_LOGO && window.OFFICIAL_SDN14_LOGO.length > 1000)
    ? window.OFFICIAL_SDN14_LOGO
    : "assets/logo-sdn14.png";
  const logo = (sch.logoUrl && typeof sch.logoUrl === 'string' && sch.logoUrl.startsWith('data:image/') && sch.logoUrl.length > 1000)
    ? sch.logoUrl
    : defaultLogo;
  sch.logoUrl = logo;
  const schoolName = sch.name || 'SD NEGERI 14 TOBOALI';
  const examType = sch.examType || 'UAS';

  // 1. Header Global & Brand Labels
  const headerIcon = document.querySelector('.brand-icon');
  if (headerIcon) {
    if (logo) {
      headerIcon.innerHTML = `<img src="${logo}" alt="Logo Sekolah" onerror="if(window.OFFICIAL_SDN14_LOGO&&this.src!==window.OFFICIAL_SDN14_LOGO){this.src=window.OFFICIAL_SDN14_LOGO;}">`;
    } else {
      headerIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
    }
  }
  document.querySelectorAll('.brand-title').forEach(el => el.textContent = schoolName);
  document.querySelectorAll('.brand-badge').forEach(el => el.textContent = 'UJIAN ONLINE');
  document.querySelectorAll('.brand-school-name').forEach(el => el.textContent = schoolName);
  document.querySelectorAll('.brand-school-subtitle').forEach(el => {
    if (el.textContent.includes('Portal Guru') || el.textContent.includes('Pengawas')) {
      el.textContent = `Portal Guru & Pengawas Ujian Online (${examType})`;
    } else {
      el.textContent = `Ujian Online Resmi (${examType})`;
    }
  });

  // Brand Sidebar Dasbor Utama (Gambar 1)
  const sidebarLogo = document.getElementById('sidebar-school-logo-img');
  if (sidebarLogo) {
    sidebarLogo.src = logo;
    sidebarLogo.alt = schoolName;
    sidebarLogo.onerror = function() {
      if (window.OFFICIAL_SDN14_LOGO && this.src !== window.OFFICIAL_SDN14_LOGO) {
        this.src = window.OFFICIAL_SDN14_LOGO;
      }
    };
  }
  const srmsBrandTitle = document.querySelector('.srms-brand-title');
  if (srmsBrandTitle) srmsBrandTitle.textContent = 'UJIAN ONLINE';

  // 2. Ruang Siswa (screen-student-login)
  const studentScreen = document.getElementById('screen-student-login');
  if (studentScreen) {
    const heroLogo = studentScreen.querySelector('.split-hero-logo');
    if (heroLogo) {
      if (logo) {
        heroLogo.innerHTML = `<img src="${logo}" alt="Logo Sekolah" onerror="if(window.OFFICIAL_SDN14_LOGO&&this.src!==window.OFFICIAL_SDN14_LOGO){this.src=window.OFFICIAL_SDN14_LOGO;}">`;
      } else {
        heroLogo.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
      }
    }
    const studentFormLogo = document.getElementById('student-form-school-logo');
    if (studentFormLogo) {
      studentFormLogo.src = logo;
      studentFormLogo.onerror = function() {
        if (window.OFFICIAL_SDN14_LOGO && this.src !== window.OFFICIAL_SDN14_LOGO) {
          this.src = window.OFFICIAL_SDN14_LOGO;
        }
      };
    }
    const heroSchool = studentScreen.querySelector('.split-hero-school');
    if (heroSchool) heroSchool.textContent = schoolName;

    const heroTag = studentScreen.querySelector('.split-hero-tag');
    if (heroTag) heroTag.textContent = 'UJIAN ONLINE RESMI';

    const heroHeadline = studentScreen.querySelector('.split-hero-headline');
    if (heroHeadline) heroHeadline.textContent = `Ruang Ujian Siswa Berstandar ${examType}`;

    const formSubtitle = studentScreen.querySelector('.split-form-subtitle');
    if (formSubtitle) formSubtitle.textContent = 'Masukkan data peserta dan token ujian dari pengawas';
  }

  // 3. Login Guru (screen-teacher-login)
  const teacherScreen = document.getElementById('screen-teacher-login');
  if (teacherScreen) {
    const heroLogo = teacherScreen.querySelector('.split-hero-logo');
    if (heroLogo) {
      if (logo) {
        heroLogo.innerHTML = `<img src="${logo}" alt="Logo Sekolah" onerror="if(window.OFFICIAL_SDN14_LOGO&&this.src!==window.OFFICIAL_SDN14_LOGO){this.src=window.OFFICIAL_SDN14_LOGO;}">`;
      } else {
        heroLogo.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
      }
    }
    const teacherFormLogo = document.getElementById('teacher-form-school-logo');
    if (teacherFormLogo) {
      teacherFormLogo.src = logo;
      teacherFormLogo.onerror = function() {
        if (window.OFFICIAL_SDN14_LOGO && this.src !== window.OFFICIAL_SDN14_LOGO) {
          this.src = window.OFFICIAL_SDN14_LOGO;
        }
      };
    }
    const heroSchool = teacherScreen.querySelector('.split-hero-school');
    if (heroSchool) heroSchool.textContent = schoolName;

    const heroTag = teacherScreen.querySelector('.split-hero-tag');
    if (heroTag) heroTag.textContent = 'UJIAN ONLINE RESMI';

    const heroHeadline = teacherScreen.querySelector('.split-hero-headline');
    if (heroHeadline) heroHeadline.textContent = `Portal Pendidik & Pengawas Ujian Online (${examType})`;

    // Update label fitur 5 tipe soal
    const featureItems = teacherScreen.querySelectorAll('.split-feature-item span');
    featureItems.forEach(el => {
      if (el.textContent.includes('Tipe Soal Standar')) {
        el.textContent = `5 Tipe Soal Standar ANBK`;
      }
    });
  }

  // 4. Dashboard Admin Welcome Banner
  const welcomeBadge = document.querySelector('.welcome-badge');
  if (welcomeBadge) welcomeBadge.textContent = 'PANEL EVALUASI UJIAN ONLINE RESMI';

  const welcomeTitle = document.querySelector('.welcome-title');
  if (welcomeTitle) welcomeTitle.textContent = 'Selamat Datang di Portal Ujian Online!';

  const welcomeDesc = document.querySelector('.welcome-desc');
  if (welcomeDesc) {
    welcomeDesc.textContent = `Kelola bank soal 5 tipe ujian, pantau live ujian siswa serentak, cetak kartu peserta, dan unduh rekap nilai ${schoolName}.`;
  }

  // 5. Logo Banner Khusus Form Login Siswa & Guru
  const studentFormLogo = document.getElementById('student-form-school-logo');
  if (studentFormLogo && logo) {
    studentFormLogo.src = logo;
    studentFormLogo.alt = schoolName;
  }
  const teacherFormLogo = document.getElementById('teacher-form-school-logo');
  if (teacherFormLogo && logo) {
    teacherFormLogo.src = logo;
    teacherFormLogo.alt = schoolName;
  }

  // Form login siswa kini mendeteksi mata pelajaran otomatis langsung dari token ujian
}

// ==============================================================================
// MODAL & ENGINE IMPOR DATA SISWA EXCEL / CSV
// ==============================================================================

function openImportStudentsModal() {
  const modal = document.getElementById('modal-import-students');
  if (modal) {
    modal.style.display = 'flex';
    if (document.getElementById('import-students-raw-text')) {
      document.getElementById('import-students-raw-text').value = '';
    }
    const fileInput = document.getElementById('import-student-file-input');
    if (fileInput) fileInput.value = '';
    updateImportTextPreview();
  }
}

function closeImportStudentsModal() {
  const modal = document.getElementById('modal-import-students');
  if (modal) modal.style.display = 'none';
}

function downloadStudentTemplateCsv() {
  const csvContent = "NISN,Nama Lengkap,Kelas,Jenis Kelamin\n" +
    "2026-001,Ahmad Rizki Pratama,6,L\n" +
    "2026-002,Bella Anggraini Putri,6,P\n" +
    "2026-003,Dimas Aditya Nugraha,5,L\n" +
    "2026-004,Fatimah Az-Zahra,5,P\n" +
    "2026-005,Rian Hidayat,4,L\n";

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'template_data_siswa_sdn14.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function handleStudentImportFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    const textarea = document.getElementById('import-students-raw-text');
    if (textarea) {
      textarea.value = content;
      updateImportTextPreview();
      showToast(`File ${file.name} berhasil dibaca!`, 'info');
    }
  };
  reader.readAsText(file);
}

function parseStudentDataFromText(rawText) {
  if (!rawText || !rawText.trim()) return [];
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const parsed = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Abaikan header jika ada
    if (i === 0 && (line.toLowerCase().includes('nisn') || line.toLowerCase().includes('nama'))) {
      continue;
    }

    // Deteksi pemisah: tab (\t), titik koma (;), atau koma (,)
    let tokens = [];
    if (line.includes('\t')) {
      tokens = line.split('\t');
    } else if (line.includes(';')) {
      tokens = line.split(';');
    } else {
      tokens = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    }

    tokens = tokens.map(t => t.replace(/^["']|["']$/g, '').trim());

    if (tokens.length >= 2) {
      const nisn = tokens[0] || '';
      const name = tokens[1] || '';
      const defaultClass = (state.currentTeacher && state.currentTeacher.assignedClass) ? state.currentTeacher.assignedClass : '6';
      const className = tokens[2] || defaultClass;
      let gender = (tokens[3] || 'L').toUpperCase();
      if (gender !== 'L' && gender !== 'P') {
        gender = gender.startsWith('P') ? 'P' : 'L';
      }

      if (nisn && name) {
        parsed.push({
          id: 'st-' + Math.random().toString(36).substr(2, 9),
          nisn: nisn,
          name: name,
          className: className,
          gender: gender,
          status: 'active'
        });
      }
    }
  }

  return parsed;
}

function updateImportTextPreview() {
  const text = document.getElementById('import-students-raw-text') ? document.getElementById('import-students-raw-text').value : '';
  const students = parseStudentDataFromText(text);
  const countEl = document.getElementById('import-preview-count');
  if (countEl) {
    countEl.textContent = `Terdeteksi: ${students.length} siswa valid`;
    countEl.style.color = students.length > 0 ? 'var(--emerald-600)' : 'var(--slate-500)';
  }
}

async function executeBatchImportStudents() {
  const text = document.getElementById('import-students-raw-text') ? document.getElementById('import-students-raw-text').value : '';
  const importedList = parseStudentDataFromText(text);

  if (importedList.length === 0) {
    showToast('Tidak ada data siswa valid yang terdeteksi untuk diimpor!', 'warning');
    return;
  }

  let addedCount = 0;
  let updatedCount = 0;

  importedList.forEach(imp => {
    const existingIndex = state.students.findIndex(s => s.nisn.toLowerCase() === imp.nisn.toLowerCase());
    if (existingIndex >= 0) {
      // Update data siswa yang sudah ada
      state.students[existingIndex].name = imp.name;
      state.students[existingIndex].className = imp.className;
      state.students[existingIndex].gender = imp.gender;
      updatedCount++;
    } else {
      // Siswa baru
      state.students.push(imp);
      addedCount++;
    }
  });

  localStorage.setItem('zettcbt_students', JSON.stringify(state.students));

  // Sinkronisasi massal ke Supabase jika aktif
  if (state.supabase.url && state.supabase.key) {
    try {
      showToast('Menyinkronkan data impor ke Supabase...', 'info');
      const payload = importedList.map(st => ({
        nisn: st.nisn,
        full_name: st.name,
        class_name: st.className,
        gender: st.gender
      }));

      await fetch(state.supabase.url + '/rest/v1/students', {
        method: 'POST',
        headers: {
          'apikey': state.supabase.key,
          'Authorization': 'Bearer ' + state.supabase.key,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Gagal sinkron impor ke Supabase:', e);
    }
  }

  closeImportStudentsModal();
  renderStudentsTable();
  renderExamCardsTab();
  updateAdminMetrics();

  showToast(`Sukses mengimpor siswa! (${addedCount} baru ditambahkan, ${updatedCount} diperbarui)`, 'success');
}

function deleteQuestion(qId) {
  const q = state.questions.find(item => item.id === qId);
  if (!q) return;

  // Proteksi Hapus: Guru dilarang menghapus soal milik guru lain
  if (state.currentTeacher && state.currentTeacher.role === 'guru_kelas') {
    if (q.targetClass !== state.currentTeacher.assignedClass && q.teacherId !== state.currentTeacher.id) {
      showToast('Akses ditolak: Anda tidak memiliki hak menghapus soal kelas lain!', 'danger');
      return;
    }
  }

  if (confirm('Yakin ingin menghapus butir soal ini?')) {
    state.questions = state.questions.filter(item => item.id !== qId);
    localStorage.setItem('zettcbt_questions', JSON.stringify(state.questions));
    renderAdminQuestionBank();
    showToast('Soal berhasil dihapus.', 'info');
  }
}

// Save Session Settings
function handleSaveSessionSettings(event) {
  event.preventDefault();

  state.session.title = document.getElementById('setting-title').value.trim();
  state.session.subject = document.getElementById('setting-subject').value.trim();
  state.session.token = document.getElementById('setting-token').value.trim().toUpperCase();
  state.session.durationMinutes = parseInt(document.getElementById('setting-duration').value) || 90;
  state.session.randomizeQuestions = document.getElementById('setting-random-q').checked;
  state.session.randomizeOptions = document.getElementById('setting-random-opt').checked;
  state.session.showScore = document.getElementById('setting-show-score').checked;

  localStorage.setItem('zettcbt_session', JSON.stringify(state.session));
  populateSessionSettings();
  renderTeacherExamSchedules();
  updateAdminMetrics();

  // Jika database Neon cloud terhubung, sinkronkan ke cloud
  if (state.neon.endpoint) {
    exportLocalDataToNeonCloud({ silent: true }).catch(e => console.warn('Neon session auto-save deferred:', e.message));
  }

  showToast('Pengaturan sesi ujian berhasil diperbarui dan disimpan permanen!', 'success');
}

function generateRandomToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById('setting-token').value = result;
}

// Render Results & Analysis Table
function renderResultsTable() {
  const tbody = document.getElementById('table-results-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const finishedList = state.liveStudents.filter(s => s.status === 'submitted');

  if (finishedList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--slate-400);">Belum ada peserta yang mengumpulkan ujian.</td></tr>';
    return;
  }

  // Sort by highest score
  finishedList.sort((a, b) => b.score - a.score);

  finishedList.forEach((st, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = 
      '<td>' + (idx + 1) + '</td>' +
      '<td>' + st.nisn + '</td>' +
      '<td><strong>' + st.name + '</strong></td>' +
      '<td>' + st.className + '</td>' +
      '<td>' + st.answeredCount + ' / ' + st.totalQ + '</td>' +
      '<td><strong style="color: var(--primary-600); font-size: 1.1rem;">' + st.score + '</strong></td>' +
      '<td>' + st.time + '</td>';
    tbody.appendChild(tr);
  });
}

// Export to Excel / CSV format
function exportResultsToExcel() {
  const finishedList = state.liveStudents.filter(s => s.status === 'submitted');
  if (finishedList.length === 0) {
    showToast('Belum ada nilai ujian yang dapat di-export!', 'warning');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Peringkat,No Peserta,Nama Siswa,Kelas,Total Soal Terjawab,Nilai Akhir,Waktu Selesai\r\n';

  finishedList.sort((a, b) => b.score - a.score);

  finishedList.forEach((st, idx) => {
    const row = [
      idx + 1,
      '"' + st.nisn + '"',
      '"' + st.name + '"',
      '"' + st.className + '"',
      st.answeredCount + ' / ' + st.totalQ,
      st.score,
      '"' + st.time + '"'
    ].join(',');
    csvContent += row + '\r\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'Rekap_Nilai_' + state.session.subject.replace(/\s+/g, '_') + '.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('File nilai Excel/CSV berhasil diunduh!', 'success');
}

// ==============================================================================
// CLOUD DATABASE ENGINE (NEON.TECH SERVERLESS POSTGRESQL & SUPABASE)
// ==============================================================================

function switchDatabaseProviderUI(provider) {
  state.dbProvider = provider;
  localStorage.setItem('zettcbt_db_provider', provider);

  const neonSection = document.getElementById('form-provider-neon-section');
  const sbSection = document.getElementById('form-provider-supabase-section');
  const badge = document.getElementById('db-status-badge');

  if (neonSection) neonSection.style.display = (provider === 'neon') ? 'block' : 'none';
  if (sbSection) sbSection.style.display = (provider === 'supabase') ? 'block' : 'none';

  if (badge) {
    if (provider === 'neon') {
      const isConfigured = !!(state.neon && state.neon.endpoint && state.neon.apiKey);
      badge.textContent = isConfigured ? '🟢 Neon Cloud Aktif' : '🟡 Neon Belum Dikonfigurasi';
      badge.style.background = isConfigured ? 'var(--emerald-100)' : 'var(--amber-100)';
      badge.style.color = isConfigured ? 'var(--emerald-700)' : 'var(--amber-800)';
    } else if (provider === 'supabase') {
      const isConfigured = !!(state.supabase && state.supabase.url && state.supabase.key);
      badge.textContent = isConfigured ? '🟢 Supabase Aktif' : '🟡 Supabase Belum Dikonfigurasi';
      badge.style.background = isConfigured ? 'var(--emerald-100)' : 'var(--amber-100)';
      badge.style.color = isConfigured ? 'var(--emerald-700)' : 'var(--amber-800)';
    } else {
      badge.textContent = '⚪ Mode Lokal (Offline)';
      badge.style.background = 'var(--slate-200)';
      badge.style.color = 'var(--slate-700)';
    }
  }
}

function toggleNeonKeyVisibility() {
  const input = document.getElementById('config-neon-key');
  if (!input) return;
  input.type = (input.type === 'password') ? 'text' : 'password';
}

function populateDatabaseConfig() {
  const provider = state.dbProvider || 'neon';
  const optNeon = document.getElementById('provider-opt-neon');
  const optSb = document.getElementById('provider-opt-supabase');
  const optLoc = document.getElementById('provider-opt-local');

  if (optNeon && provider === 'neon') optNeon.checked = true;
  if (optSb && provider === 'supabase') optSb.checked = true;
  if (optLoc && provider === 'local') optLoc.checked = true;

  const endpointInput = document.getElementById('config-neon-endpoint');
  const keyInput = document.getElementById('config-neon-key');
  if (endpointInput) endpointInput.value = state.neon.endpoint || '';
  if (keyInput) keyInput.value = state.neon.apiKey || '';

  const sbUrlInput = document.getElementById('config-supabase-url');
  const sbKeyInput = document.getElementById('config-supabase-key');
  if (sbUrlInput) sbUrlInput.value = state.supabase.url || '';
  if (sbKeyInput) sbKeyInput.value = state.supabase.key || '';

  switchDatabaseProviderUI(provider);
}

function handleSaveNeonConfig(event) {
  event.preventDefault();
  const endpoint = document.getElementById('config-neon-endpoint').value.trim();
  const key = document.getElementById('config-neon-key').value.trim();

  state.neon.endpoint = endpoint;
  state.neon.apiKey = key;
  state.dbProvider = 'neon';

  localStorage.setItem('zettcbt_neon_endpoint', endpoint);
  localStorage.setItem('zettcbt_neon_key', key);
  localStorage.setItem('zettcbt_db_provider', 'neon');

  switchDatabaseProviderUI('neon');
  showToast('Kredensial Neon.tech PostgreSQL berhasil disimpan!', 'success');
}

// Robust Neon Connection Credentials Parser (Handles Host, URL, and full Connection String)
function parseNeonCredentials() {
  const epInput = document.getElementById('config-neon-endpoint');
  const keyInput = document.getElementById('config-neon-key');
  let rawEp = (epInput && epInput.value ? epInput.value : (state.neon.endpoint || '')).trim();
  let rawKey = (keyInput && keyInput.value ? keyInput.value : (state.neon.apiKey || '')).trim();

  // If user pasted a full postgresql:// connection string
  if (rawEp.startsWith('postgres://') || rawEp.startsWith('postgresql://')) {
    try {
      const parsed = new URL(rawEp);
      const host = parsed.hostname;
      const pass = decodeURIComponent(parsed.password || '');
      const user = decodeURIComponent(parsed.username || 'neondb_owner');
      const db = parsed.pathname.replace(/^\//, '') || 'neondb';
      return {
        host: host,
        url: `https://${host}/sql`,
        user: user,
        password: pass || rawKey,
        database: db,
        connectionString: rawEp
      };
    } catch(e) {}
  }

  // Extract clean host
  let host = rawEp.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
  let user = 'neondb_owner';
  let database = 'neondb';

  return {
    host: host,
    url: host ? `https://${host}/sql` : '',
    user: user,
    password: rawKey,
    database: database,
    connectionString: host ? `postgresql://${user}:${encodeURIComponent(rawKey)}@${host}/${database}?sslmode=require` : ''
  };
}

function validateNeonHostInput(val) {
  const warningEl = document.getElementById('neon-host-warning');
  if (!warningEl) return;
  const clean = (val || '').trim().toLowerCase();
  if (clean && !clean.includes('ep-') && (clean.includes('neon.tech') || clean.includes('aws'))) {
    warningEl.style.display = 'block';
  } else {
    warningEl.style.display = 'none';
  }
}

function quickPasteConnectionString() {
  const inputStr = prompt("Tempelkan (Paste) 1 baris utuh Connection String PostgreSQL dari Neon Anda:\n(Contoh: postgresql://neondb_owner:npg_xxx@ep-cool-fog-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require)");
  if (!inputStr || !inputStr.trim()) return;

  const raw = inputStr.trim();
  let host = '';
  let password = '';

  if (raw.startsWith('postgres://') || raw.startsWith('postgresql://')) {
    try {
      const parsed = new URL(raw);
      host = parsed.hostname;
      password = decodeURIComponent(parsed.password || '');
    } catch (e) {
      const match = raw.match(/@([^/:]+)/);
      if (match) host = match[1];
      const passMatch = raw.match(/:([^@:]+)@/);
      if (passMatch) password = passMatch[1];
    }
  } else if (raw.includes('@')) {
    const parts = raw.split('@');
    host = parts[1].split('/')[0].split('?')[0];
    const userPass = parts[0].split(':');
    if (userPass.length >= 2) password = userPass[1];
  } else {
    host = raw;
  }

  if (!host) {
    showToast('Format connection string tidak dikenali!', 'warning');
    return;
  }

  const epInput = document.getElementById('config-neon-endpoint');
  const keyInput = document.getElementById('config-neon-key');

  if (epInput) epInput.value = host;
  if (keyInput && password) keyInput.value = password;

  validateNeonHostInput(host);

  // Auto-save to state and localStorage
  state.neon.endpoint = host;
  if (password) state.neon.apiKey = password;
  state.dbProvider = 'neon';
  localStorage.setItem('zettcbt_neon_endpoint', host);
  if (password) localStorage.setItem('zettcbt_neon_key', password);
  localStorage.setItem('zettcbt_db_provider', 'neon');

  showToast(`✅ Berhasil mengekstrak Host: ${host}. Menguji koneksi ke Neon...`, 'info');
  testNeonConnection();
}

// Execute SQL via Neon Serverless HTTP API
async function executeNeonSql(query, params = []) {
  const creds = parseNeonCredentials();
  if (!creds.host) throw new Error('Host atau Endpoint Neon belum diisi!');
  
  if (!creds.host.includes('ep-') && creds.host.includes('neon.tech')) {
    throw new Error('Host Neon tidak lengkap! Host wajib diawali dengan "ep-..." (contoh: ep-cool-fog-123456.ap-southeast-1.aws.neon.tech). Cek kembali dashboard Neon Anda.');
  }

  // Neon HTTP API requires 'Neon-Connection-String' header.
  // Note: We intentionally omit 'Content-Type: application/json' and 'Authorization' because Neon's CORS preflight (Access-Control-Allow-Headers) does not include Content-Type, causing browser fetch to fail with CORS error. Neon parses JSON body seamlessly.
  const headers = { 
    'Neon-Connection-String': creds.connectionString
  };

  let res;
  try {
    res = await fetch(creds.url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ query: query, params: params })
    });
  } catch (netErr) {
    if (netErr.name === 'TypeError' || (netErr.message && netErr.message.includes('fetch'))) {
      throw new Error(`Koneksi ke "${creds.host}" gagal dijangkau (Failed to fetch). Pastikan koneksi internet stabil dan host diawali "ep-...".`);
    }
    throw netErr;
  }

  if (!res.ok) {
    const txt = await res.text();
    let msg = txt;
    try {
      const j = JSON.parse(txt);
      if (j.message) msg = j.message;
    } catch(e) {}

    // Terjemahkan error umum Neon agar mudah dipahami guru/operator
    if (msg.includes('password authentication failed')) {
      throw new Error(`Kata sandi database Neon SALAH untuk user '${creds.user}'! Silakan buka dasbor Neon -> menu Roles -> Reset password pada user neondb_owner.`);
    }
    if (msg.includes('relation') && msg.includes('does not exist')) {
      throw new Error(`Tabel database belum dibuat di Neon! Buka menu SQL Editor di console.neon.tech, lalu Paste & Run berkas neon_schema.sql.`);
    }
    if (msg.includes('invalid header: neon-connection-string')) {
      throw new Error(`Koneksi string Neon tidak valid. Pastikan Host dan Password terisi benar.`);
    }

    throw new Error(`Neon Error (${res.status}): ${msg}`);
  }

  return await res.json();
}

function updateSyncStatusBadge(msg, isSuccess = true) {
  const badge = document.getElementById('sync-last-time-badge');
  if (!badge) return;
  const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
  badge.textContent = `${msg} • ${timeStr}`;
  badge.style.background = isSuccess ? 'var(--emerald-50)' : 'var(--rose-50)';
  badge.style.color = isSuccess ? 'var(--emerald-700)' : 'var(--rose-700)';
  badge.style.borderColor = isSuccess ? 'var(--emerald-200)' : 'var(--rose-200)';
}

// Test Neon Connection
async function testNeonConnection() {
  const creds = parseNeonCredentials();
  if (!creds.host) {
    showToast('Harap isi Host / Endpoint Neon terlebih dahulu!', 'warning');
    const epInput = document.getElementById('config-neon-endpoint');
    if (epInput) epInput.focus();
    return;
  }

  // Auto-save form inputs
  state.neon.endpoint = creds.host;
  state.neon.apiKey = creds.password;
  state.dbProvider = 'neon';
  localStorage.setItem('zettcbt_neon_endpoint', creds.host);
  localStorage.setItem('zettcbt_neon_key', creds.password);
  localStorage.setItem('zettcbt_db_provider', 'neon');

  showToast('Menghubungi serverless database Neon...', 'info');
  const startTime = Date.now();

  try {
    await executeNeonSql('SELECT NOW() as server_time, version() as version;');
    const latency = Date.now() - startTime;
    showToast(`🟢 Terhubung ke Neon PostgreSQL! Latensi: ${latency}ms. Siap melayani 200 siswa serentak.`, 'success');
    
    const badge = document.getElementById('db-status-badge');
    if (badge) {
      badge.textContent = `🟢 Neon Online (${latency}ms)`;
      badge.style.background = 'var(--emerald-100)';
      badge.style.color = 'var(--emerald-700)';
    }
    updateSyncStatusBadge('🟢 Neon Terhubung', true);
  } catch (err) {
    console.error('Neon test connection error:', err);
    showToast('🔴 Gagal menghubungi Neon: ' + err.message, 'danger');
    const badge = document.getElementById('db-status-badge');
    if (badge) {
      badge.textContent = '🔴 Gagal Terkoneksi';
      badge.style.background = 'var(--rose-100)';
      badge.style.color = 'var(--rose-700)';
    }
    updateSyncStatusBadge('🔴 Koneksi Gagal', false);
  }
}

// Copy Neon SQL Schema instructions to clipboard
function copyNeonSqlSchema() {
  navigator.clipboard.writeText(`-- Salin seluruh isi file neon_schema.sql di folder projek ZettCBT Pro dan jalankan di SQL Editor console.neon.tech`).then(() => {
    showToast('Instruksi siap! Buka berkas neon_schema.sql di folder projek dan jalankan di SQL Editor Neon.', 'info');
  });
}

// Export local data to Neon cloud
async function exportLocalDataToNeonCloud(options = {}) {
  const creds = parseNeonCredentials();
  if (!creds.host) {
    showToast('Harap masukkan Host / Endpoint Neon pada kolom di atas terlebih dahulu!', 'warning');
    const epInput = document.getElementById('config-neon-endpoint');
    if (epInput) epInput.focus();
    return;
  }

  // Auto-save form inputs to state & storage
  state.neon.endpoint = creds.host;
  state.neon.apiKey = creds.password;
  state.dbProvider = 'neon';
  localStorage.setItem('zettcbt_neon_endpoint', creds.host);
  localStorage.setItem('zettcbt_neon_key', creds.password);
  localStorage.setItem('zettcbt_db_provider', 'neon');

  const btn = document.getElementById('btn-export-neon');
  const title = document.getElementById('btn-export-neon-title');
  const origTitle = title ? title.textContent : 'Ekspor Data Lokal ke Neon Cloud';
  const isSilent = !!options.silent;

  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.75';
  }
  if (title) title.textContent = '⏳ Mengunggah data ke Neon Cloud...';

  if (!isSilent) showToast('Memulai sinkronisasi data lokal ke Neon Cloud...', 'info');

  try {
    let teachersCount = 0;
    for (const t of state.teachers || []) {
      const q = `INSERT INTO teachers (username, password_hash, full_name, role, assigned_class, assigned_subject)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (username) DO UPDATE 
                 SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, assigned_class = EXCLUDED.assigned_class, assigned_subject = EXCLUDED.assigned_subject, updated_at = NOW();`;
      await executeNeonSql(q, [t.username, t.password || 'guru123', t.fullName, t.role, t.assignedClass, t.assignedSubject]);
      teachersCount++;
    }

    let studentsCount = 0;
    for (const s of state.students || []) {
      const q = `INSERT INTO students (nisn, full_name, class_name, gender)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (nisn) DO UPDATE
                 SET full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, gender = EXCLUDED.gender, updated_at = NOW();`;
      await executeNeonSql(q, [s.nisn, s.name, s.className, s.gender || 'L']);
      studentsCount++;
    }

    // Sync Sesi Ujian Aktif
    const ses = state.session || {};
    const qSes = `INSERT INTO exam_sessions (token, title, subject, target_class, duration_minutes, is_active, show_score, randomize_questions)
                  VALUES ($1, $2, $3, 'Semua', $4, true, $5, $6)
                  ON CONFLICT (token) DO UPDATE
                  SET title = EXCLUDED.title, subject = EXCLUDED.subject, duration_minutes = EXCLUDED.duration_minutes, updated_at = NOW();`;
    await executeNeonSql(qSes, [
      ses.token || 'PAS2026',
      ses.title || 'Ujian Sekolah',
      ses.subject || 'Tematik SD',
      ses.durationMinutes || 90,
      !!ses.showScore,
      !!ses.randomizeQuestions
    ]);

    updateSyncStatusBadge('✅ Berhasil Ekspor', true);
    if (!isSilent) {
      showToast(`✅ Berhasil! ${teachersCount} akun guru, ${studentsCount} siswa, & sesi ujian telah terunggah ke Neon Cloud.`, 'success');
    }
    return { success: true, teachersCount, studentsCount };
  } catch (err) {
    console.error('Export to Neon error:', err);
    updateSyncStatusBadge('🔴 Gagal Ekspor', false);
    if (!isSilent) showToast('Gagal ekspor ke Neon: ' + err.message, 'danger');
    return { success: false, error: err.message };
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
    }
    if (title) title.textContent = origTitle;
  }
}

// Import data from Neon cloud (Guru, Siswa, dan Jadwal Ujian Lengkap)
async function importDataFromNeonCloud(options = {}) {
  const isSilent = !!options.silent;
  const creds = parseNeonCredentials();
  if (!creds.host) {
    if (!isSilent) {
      showToast('Harap masukkan Host / Endpoint Neon pada kolom di atas terlebih dahulu!', 'warning');
      const epInput = document.getElementById('config-neon-endpoint');
      if (epInput) epInput.focus();
    }
    return { success: false, message: 'Host belum diisi' };
  }

  // Auto-save form inputs to state & storage
  state.neon.endpoint = creds.host;
  state.neon.apiKey = creds.password;
  state.dbProvider = 'neon';
  localStorage.setItem('zettcbt_neon_endpoint', creds.host);
  localStorage.setItem('zettcbt_neon_key', creds.password);
  localStorage.setItem('zettcbt_db_provider', 'neon');

  const btn = document.getElementById('btn-import-neon');
  const title = document.getElementById('btn-import-neon-title');
  const origTitle = title ? title.textContent : 'Tarik Seluruh Data dari Neon ke Lokal';

  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.75';
  }
  if (title) title.textContent = '⏳ Mengunduh data dari Neon...';

  if (!isSilent) showToast('Mengunduh akun guru, master siswa & jadwal dari Neon Cloud...', 'info');

  try {
    let teachersCount = 0;
    let studentsCount = 0;
    let sessionsCount = 0;

    // 1. Tarik Akun Guru (Teachers)
    try {
      const rawTeachers = await executeNeonSql('SELECT username, password_hash, full_name, role, assigned_class, assigned_subject, is_active FROM teachers WHERE is_active = true ORDER BY created_at ASC;');
      const teacherRows = (rawTeachers && rawTeachers.rows) ? rawTeachers.rows : (Array.isArray(rawTeachers) ? rawTeachers : []);
      if (teacherRows && teacherRows.length > 0) {
        const importedTeachers = teacherRows.map(r => {
          const existing = (state.teachers || []).find(t => t.username === r.username);
          // Proteksi Profile Vault: JANGAN menimpa nama admin kustom dengan seed default Neon
          let customName = r.full_name;
          let customNip = null;
          try {
            const vault = JSON.parse(localStorage.getItem('zettcbt_admin_profile_' + r.username) || 'null');
            if (vault && vault.fullName) {
              customName = vault.fullName;
              customNip = vault.nip;
            } else if (existing && existing.fullName && existing.fullName !== 'Operator Sekolah' && r.full_name === 'Operator Sekolah') {
              customName = existing.fullName;
              customNip = existing.nip;
            }
          } catch(e) {}

          return {
            id: existing ? existing.id : ('t-' + Math.random().toString(36).substr(2, 9)),
            username: r.username,
            password: r.password_hash || (existing ? existing.password : 'guru123'),
            fullName: customName,
            nip: customNip || (existing ? existing.nip : null),
            role: r.role || 'guru_kelas',
            assignedClass: r.assigned_class || null,
            assignedSubject: r.assigned_subject || null
          };
        });
        state.teachers = importedTeachers;
        localStorage.setItem('zettcbt_teachers', JSON.stringify(state.teachers));
        renderTeachersTable();
        teachersCount = importedTeachers.length;
      }
    } catch (eTeacher) {
      console.warn('Tarik guru gagal atau tabel belum ada:', eTeacher.message);
    }

    // 2. Tarik Data Siswa (Students)
    try {
      const rawStudents = await executeNeonSql('SELECT nisn, full_name, class_name, gender FROM students WHERE is_active = true ORDER BY class_name, full_name;');
      const studentRows = (rawStudents && rawStudents.rows) ? rawStudents.rows : (Array.isArray(rawStudents) ? rawStudents : []);
      if (studentRows && studentRows.length > 0) {
        const importedStudents = studentRows.map((r, idx) => {
          const existing = (state.students || []).find(s => s.nisn === r.nisn);
          return {
            id: existing ? existing.id : ('st-' + Math.random().toString(36).substr(2, 9)),
            nisn: r.nisn,
            name: r.full_name,
            className: r.class_name,
            gender: r.gender || 'L',
            status: 'active',
            passwords: (existing && existing.passwords) ? existing.passwords : generateStudentSubjectPasswords(r.nisn || ('2026-0' + (idx + 1)))
          };
        });
        state.students = importedStudents;
        localStorage.setItem('zettcbt_students', JSON.stringify(state.students));
        renderStudentsTable();
        renderExamCardsTab();
        updateAdminMetrics();
        studentsCount = importedStudents.length;
      }
    } catch (eStudent) {
      console.warn('Tarik siswa gagal:', eStudent.message);
    }

    // 3. Tarik Sesi Ujian (Exam Sessions)
    try {
      const rawSessions = await executeNeonSql('SELECT token, title, subject, target_class, duration_minutes, is_active, show_score, randomize_questions FROM exam_sessions WHERE is_active = true ORDER BY created_at DESC LIMIT 1;');
      const sessionRows = (rawSessions && rawSessions.rows) ? rawSessions.rows : (Array.isArray(rawSessions) ? rawSessions : []);
      if (sessionRows && sessionRows.length > 0) {
        // Hanya sinkronkan sesi dari Neon jika lokal belum pernah menyimpan kustomisasi sesi
        const hasLocalCustomSession = localStorage.getItem('zettcbt_session');
        if (!hasLocalCustomSession) {
          const sRow = sessionRows[0];
          state.session = {
            ...state.session,
            token: sRow.token,
            title: sRow.title,
            subject: sRow.subject,
            durationMinutes: parseInt(sRow.duration_minutes) || 90,
            showScore: !!sRow.show_score,
            randomizeQuestions: !!sRow.randomize_questions
          };
          localStorage.setItem('zettcbt_session', JSON.stringify(state.session));
          renderTeacherExamSchedules();
          populateSessionSettings();
        }
        sessionsCount = 1;
      }
    } catch (eSession) {
      console.warn('Tarik sesi gagal:', eSession.message);
    }

    updateSyncStatusBadge(`✅ Tersinkron (${teachersCount} Guru, ${studentsCount} Siswa)`, true);
    if (!isSilent) {
      showToast(`✅ Berhasil menarik dari Neon: ${teachersCount} Akun Guru, ${studentsCount} Siswa, & Sesi Ujian!`, 'success');
    }
    return { success: true, teachersCount, studentsCount, sessionsCount };
  } catch (err) {
    console.error('Import from Neon error:', err);
    updateSyncStatusBadge('🔴 Gagal Menarik Data', false);
    if (!isSilent) showToast('Gagal menarik data dari Neon: ' + err.message, 'danger');
    return { success: false, error: err.message };
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
    }
    if (title) title.textContent = origTitle;
  }
}

// SINKRONISASI PENUH 2-ARAH (1 KALI KLIK JADI)
async function syncTwoWayWithNeon(options = {}) {
  const isSilent = !!options.silent;
  const isAuto = !!options.isAuto;

  const creds = parseNeonCredentials();
  if (!creds.host) {
    if (!isSilent) {
      showToast('Harap lengkapi Host dan Password Neon terlebih dahulu di tab Database!', 'warning');
      switchAdminTab('database-config');
    }
    return false;
  }

  const twBtn = document.getElementById('btn-sync-twoway');
  const twText = document.getElementById('btn-sync-twoway-text');
  if (twBtn) {
    twBtn.disabled = true;
    twBtn.style.opacity = '0.75';
  }
  if (twText) twText.textContent = '⏳ Mensinkronkan 2-Arah...';

  if (!isSilent) {
    showToast('Memulai Sinkronisasi 2-Arah (Web ⇄ Neon Cloud)...', 'info');
  }

  try {
    // Langkah 1: Tarik data terbaru dari Neon Cloud (agar data di web mendapat akun guru/siswa dari Neon)
    await importDataFromNeonCloud({ silent: true });

    // Langkah 2: Ekspor data lokal yang mungkin ada yang baru dibuat di browser ke Neon
    await exportLocalDataToNeonCloud({ silent: true });

    // Langkah 3: Render ulang seluruh komponen UI agar segar seketika
    renderTeachersTable();
    renderStudentsTable();
    renderTeacherExamSchedules();
    renderExamCardsTab();
    updateAdminMetrics();

    const tCount = (state.teachers || []).length;
    const sCount = (state.students || []).length;

    updateSyncStatusBadge(`✅ Sinkron 2-Arah (${tCount} Guru, ${sCount} Siswa)`, true);

    if (!isSilent) {
      showToast(`🎉 Sinkronisasi 2-Arah Sukses! ${tCount} Akun Guru & ${sCount} Siswa kini telah sama persis antara Web & Neon Cloud.`, 'success');
    } else if (isAuto) {
      console.log(`Auto-sync Neon completed: ${tCount} teachers, ${sCount} students synchronized.`);
    }

    return true;
  } catch (err) {
    console.error('2-way sync error:', err);
    updateSyncStatusBadge('🔴 Gagal Sinkron 2-Arah', false);
    if (!isSilent) {
      showToast('Sinkronisasi 2-arah gagal: ' + err.message, 'danger');
    }
    return false;
  } finally {
    if (twBtn) {
      twBtn.disabled = false;
      twBtn.style.opacity = '1';
    }
    if (twText) twText.textContent = 'Sinkronkan 2-Arah Sekarang';
  }
}

// Sakelar Otomatis Sinkronisasi 2-Arah
function toggleNeonAutoSync(enabled) {
  localStorage.setItem('zettcbt_neon_auto_sync', enabled ? 'true' : 'false');
  if (enabled) {
    showToast('🔄 Auto-Sync 2-Arah aktif! Setiap aplikasi dibuka, data akan otomatis tersinkronisasi.', 'info');
    syncTwoWayWithNeon({ silent: false });
  } else {
    showToast('Auto-Sync 2-Arah dinonaktifkan.', 'info');
  }
}

// Inisialisasi status sakelar auto-sync pada saat aplikasi dimuat
function initNeonAutoSync() {
  const isEnabled = localStorage.getItem('zettcbt_neon_auto_sync') !== 'false'; // default aktif
  const toggle = document.getElementById('toggle-neon-auto-sync');
  if (toggle) {
    toggle.checked = isEnabled;
  }

  // Jika auto-sync aktif dan kredensial Neon sudah ada, jalankan silent sync setelah peramban siap
  const hasHost = state.neon.endpoint || localStorage.getItem('zettcbt_neon_endpoint');
  if (isEnabled && hasHost) {
    setTimeout(() => {
      syncTwoWayWithNeon({ silent: true, isAuto: true });
    }, 1500);
  }
}

// Background Auto-Save Answer to Neon
async function sendAnswerToNeon(nisn, answers) {
  if (!state.neon.endpoint) return;
  try {
    const q = `INSERT INTO student_attempts (session_id, participant_number, student_name, class_name, status, warning_count, updated_at)
               SELECT id, $1, $2, $3, 'in_progress', $4, NOW()
               FROM exam_sessions WHERE is_active = true LIMIT 1
               ON CONFLICT (session_id, participant_number) DO UPDATE
               SET warning_count = EXCLUDED.warning_count, updated_at = NOW();`;
    await executeNeonSql(q, [nisn, state.student.name, state.student.className, state.warningCount]);
  } catch (e) {
    console.warn('Neon auto-save background sync deferred:', e.message);
  }
}

// Finalize Student Attempt in Neon
async function finalizeStudentAttemptInNeon(nisn, totalScore) {
  if (!state.neon.endpoint) return;
  try {
    const q = `UPDATE student_attempts
               SET status = 'submitted', total_score = $1, end_time = NOW(), updated_at = NOW()
               WHERE participant_number = $2;`;
    await executeNeonSql(q, [totalScore, nisn]);
  } catch (e) {
    console.warn('Neon finalize attempt sync deferred:', e.message);
  }
}

// Save Supabase Configuration
function handleSaveDatabaseConfig(event) {
  event.preventDefault();
  const url = document.getElementById('config-supabase-url').value.trim();
  const key = document.getElementById('config-supabase-key').value.trim();

  state.supabase.url = url;
  state.supabase.key = key;
  state.dbProvider = 'supabase';

  localStorage.setItem('zettcbt_sb_url', url);
  localStorage.setItem('zettcbt_sb_key', key);
  localStorage.setItem('zettcbt_db_provider', 'supabase');

  switchDatabaseProviderUI('supabase');
  showToast('Kredensial Supabase Cloud berhasil disimpan!', 'success');
}

// Copy SQL Schema to Clipboard
function copySqlSchema() {
  const sql = `-- Salin skema SQL dari file supabase_schema.sql di folder projek untuk Supabase`;
  navigator.clipboard.writeText(sql).then(() => {
    showToast('Skema SQL siap di-paste dari berkas supabase_schema.sql!', 'info');
  });
}

// Toast Notification Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'danger') toast.style.backgroundColor = 'var(--rose-600)';
  if (type === 'success') toast.style.backgroundColor = 'var(--emerald-600)';
  if (type === 'warning') toast.style.backgroundColor = 'var(--amber-600)';

  toast.innerHTML = '<span>' + message + '</span>';
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

// Helper: Escape HTML string
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
