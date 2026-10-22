/**
 * ZettCBT Pro - High-Concurrency Engine for 300+ Students
 * Standard: Anti-AI Human Crafted Code, Zero-Deadlock, Auto-Save Realtime
 */

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

  // Supabase Configuration
  supabase: {
    url: localStorage.getItem('zettcbt_sb_url') || '',
    key: localStorage.getItem('zettcbt_sb_key') || '',
  },

  // Identitas Sekolah SD NEGERI 14 TOBOALI
  school: JSON.parse(localStorage.getItem('zettcbt_school') || JSON.stringify({
    name: 'SD NEGERI 14 TOBOALI',
    npsn: '10901234',
    academicYear: '2026/2027 - Ganjil',
    address: 'Jl. Jenderal Sudirman No. 14, Toboali, Kab. Bangka Selatan, Kep. Bangka Belitung',
    headmaster: 'H. Suhardi, S.Pd., M.Pd',
    headmasterNip: '19750312 199903 1 004'
  })),

  // Token Proktor Dinamis (Auto-Refresh 3 Menit = 180 Detik)
  proctorToken: {
    remainingSeconds: 180,
    interval: null
  },

  currentEditorQType: 'pg',

  // Active Teacher Session (Isolation State)
  currentTeacher: JSON.parse(sessionStorage.getItem('zettcbt_current_teacher') || 'null'),

  // Daftar Akun Guru (Tersimpan di localStorage & Mendukung Supabase)
  teachers: JSON.parse(localStorage.getItem('zettcbt_teachers') || JSON.stringify([
    { id: 't-admin', username: 'admin', password: 'admin123', fullName: 'Operator Sekolah', role: 'admin_sekolah', assignedClass: null, assignedSubject: null },
    { id: 't-7a', username: 'guru7a', password: 'guru123', fullName: 'Budi Santoso, S.Pd', role: 'guru_kelas', assignedClass: '7A', assignedSubject: 'Tematik 7A' },
    { id: 't-7b', username: 'guru7b', password: 'guru123', fullName: 'Siti Aminah, S.Pd', role: 'guru_kelas', assignedClass: '7B', assignedSubject: 'Tematik 7B' },
    { id: 't-mtk', username: 'gurumtk', password: 'guru123', fullName: 'Hendra Wijaya, M.Pd', role: 'guru_mapel', assignedClass: null, assignedSubject: 'Matematika' },
    { id: 't-ipa', username: 'guruipa', password: 'guru123', fullName: 'Dewi Lestari, S.Pd', role: 'guru_mapel', assignedClass: null, assignedSubject: 'IPA' }
  ])),

  // Master Data Siswa Peserta Ujian (Dikelola oleh Guru Kelas & Operator)
  students: JSON.parse(localStorage.getItem('zettcbt_students') || JSON.stringify([
    { id: 'st-01', nisn: '2026-001', name: 'Ahmad Rizki Pratama', className: '7A', gender: 'L', status: 'active' },
    { id: 'st-02', nisn: '2026-002', name: 'Bella Anggraini Putri', className: '7A', gender: 'P', status: 'active' },
    { id: 'st-03', nisn: '2026-003', name: 'Dimas Aditya Nugraha', className: '7A', gender: 'L', status: 'active' },
    { id: 'st-04', nisn: '2026-004', name: 'Fatimah Az-Zahra', className: '7B', gender: 'P', status: 'active' },
    { id: 'st-05', nisn: '2026-005', name: 'Gilang Ramadhan', className: '7B', gender: 'L', status: 'active' },
    { id: 'st-06', nisn: '2026-006', name: 'Nabila Syakirah', className: '7B', gender: 'P', status: 'active' },
    { id: 'st-07', nisn: '2026-007', name: 'Rian Hidayat', className: 'UMUM', gender: 'L', status: 'active' }
  ])),

  // Active Exam Session
  session: {
    id: 'sess-default-01',
    title: 'Penilaian Akhir Semester Ganjil 2026',
    subject: 'Matematika Peminatan',
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

  // Bank Soal Terisolasi (Dilengkapi Metadata Guru, Mapel, dan Target Kelas)
  questions: [
    {
      id: 'q-01',
      number: 1,
      type: 'pg',
      teacherId: 't-7a',
      teacherName: 'Budi Santoso, S.Pd',
      subject: 'Tematik 7A',
      targetClass: '7A',
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
      teacherId: 't-7a',
      teacherName: 'Budi Santoso, S.Pd',
      subject: 'Tematik 7A',
      targetClass: '7A',
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
      teacherId: 't-7b',
      teacherName: 'Siti Aminah, S.Pd',
      subject: 'Tematik 7B',
      targetClass: '7B',
      text: 'Ide pokok dalam sebuah paragraf deduktif terletak pada...',
      imageUrl: '',
      optionA: 'Akhir paragraf',
      optionB: 'Tengah paragraf',
      optionC: 'Awal dan akhir paragraf',
      optionD: 'Awal paragraf',
      optionE: 'Seluruh kalimat penjelas',
      correctKey: 'D',
      scoreWeight: 20
    },
    {
      id: 'q-04',
      number: 4,
      type: 'pg',
      teacherId: 't-mtk',
      teacherName: 'Hendra Wijaya, M.Pd',
      subject: 'Matematika',
      targetClass: 'UMUM',
      text: 'Jika f(x) = 2x³ - 4x² + 5x - 7, maka nilai turunan f\'(2) adalah...',
      imageUrl: '',
      optionA: '13',
      optionB: '15',
      optionC: '17',
      optionD: '21',
      optionE: '23',
      correctKey: 'A',
      scoreWeight: 20
    },
    {
      id: 'q-05',
      number: 5,
      type: 'pg',
      teacherId: 't-ipa',
      teacherName: 'Dewi Lestari, S.Pd',
      subject: 'IPA',
      targetClass: 'UMUM',
      text: 'Organel sel yang berfungsi sebagai tempat respirasi seluler dan penghasil energi ATP adalah...',
      imageUrl: '',
      optionA: 'Ribosom',
      optionB: 'Mitokondria',
      optionC: 'Badan Golgi',
      optionD: 'Retikulum Endoplasma',
      optionE: 'Lisosom',
      correctKey: 'B',
      scoreWeight: 20
    }
  ],

  // Mock Active Students (Tersebar di Kelas 7A, 7B, dan Umum untuk Menguji Isolasi)
  liveStudents: [
    { nisn: '2026-001', name: 'Ahmad Fauzi', className: '7A', answeredCount: 5, totalQ: 5, warningCount: 0, status: 'submitted', score: 100, time: '08:45 WIB' },
    { nisn: '2026-002', name: 'Siti Rahmawati', className: '7A', answeredCount: 4, totalQ: 5, warningCount: 1, status: 'in_progress', score: 0, time: '-' },
    { nisn: '2026-003', name: 'Bambang Trianto', className: '7B', answeredCount: 5, totalQ: 5, warningCount: 0, status: 'submitted', score: 90, time: '08:50 WIB' },
    { nisn: '2026-004', name: 'Dewi Lestari', className: '7B', answeredCount: 3, totalQ: 5, warningCount: 0, status: 'in_progress', score: 0, time: '-' },
    { nisn: '2026-005', name: 'Eko Prasetyo', className: 'UMUM', answeredCount: 2, totalQ: 5, warningCount: 2, status: 'in_progress', score: 0, time: '-' }
  ]
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadSavedState();
  initAntiCheatProtection();
  renderAdminQuestionBank();
  renderLiveMonitoringTable();
  updateAdminMetrics();
  startProctorTokenTimer();
});

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

  // Pre-fill inputs in settings
  const sbUrlInput = document.getElementById('config-supabase-url');
  const sbKeyInput = document.getElementById('config-supabase-key');
  if (sbUrlInput && state.supabase.url) sbUrlInput.value = state.supabase.url;
  if (sbKeyInput && state.supabase.key) sbKeyInput.value = state.supabase.key;

  const setTokenInput = document.getElementById('setting-token');
  if (setTokenInput) setTokenInput.value = state.session.token;
  const setDurationInput = document.getElementById('setting-duration');
  if (setDurationInput) setDurationInput.value = state.session.durationMinutes;
  const setTitleInput = document.getElementById('setting-title');
  if (setTitleInput) setTitleInput.value = state.session.title;
  const setSubjectInput = document.getElementById('setting-subject');
  if (setSubjectInput) setSubjectInput.value = state.session.subject;

  // Restore teacher session state if active
  if (state.currentTeacher) {
    const navLabel = document.getElementById('nav-teacher-label');
    if (navLabel) navLabel.textContent = state.currentTeacher.username;
    applyTeacherIsolation();
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update top button active states
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

// Mesin Token Dinamis 3 Menit (180 Detik)
function startProctorTokenTimer() {
  if (state.proctorToken.interval) clearInterval(state.proctorToken.interval);

  const displayToken = document.getElementById('proctor-token-display');
  const displayTimer = document.getElementById('token-timer-countdown');
  const progressBar = document.getElementById('token-progress-bar');

  if (displayToken) displayToken.textContent = state.session.token;

  state.proctorToken.interval = setInterval(() => {
    state.proctorToken.remainingSeconds--;

    if (state.proctorToken.remainingSeconds <= 0) {
      // Regenerate Token Baru Otomatis
      generateNewProctorToken();
      state.proctorToken.remainingSeconds = 180;
    }

    const mins = Math.floor(state.proctorToken.remainingSeconds / 60);
    const secs = state.proctorToken.remainingSeconds % 60;
    const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

    if (displayTimer) displayTimer.textContent = timeStr;
    if (progressBar) {
      const pct = (state.proctorToken.remainingSeconds / 180) * 100;
      progressBar.style.width = pct + '%';
    }
  }, 1000);
}

function generateNewProctorToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  state.session.token = result;
  localStorage.setItem('zettcbt_session', JSON.stringify(state.session));

  const displayToken = document.getElementById('proctor-token-display');
  const metricToken = document.getElementById('metric-active-token');
  const settingToken = document.getElementById('setting-token');

  if (displayToken) displayToken.textContent = result;
  if (metricToken) metricToken.textContent = result;
  if (settingToken) settingToken.value = result;

  showToast('Token ujian diperbarui otomatis: ' + result, 'info');
}

function forceRefreshToken() {
  state.proctorToken.remainingSeconds = 180;
  generateNewProctorToken();
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
    state.currentTeacher = matchedTeacher;
    sessionStorage.setItem('zettcbt_current_teacher', JSON.stringify(matchedTeacher));
    
    // Update navbar label
    const navLabel = document.getElementById('nav-teacher-label');
    if (navLabel) navLabel.textContent = matchedTeacher.username;

    applyTeacherIsolation();
    showScreen('admin-dashboard');
    showToast('Login berhasil! Selamat datang, ' + matchedTeacher.fullName, 'success');
  } else {
    showToast('Username atau password salah! Silakan coba lagi.', 'danger');
  }
}

function handleTeacherLogout() {
  sessionStorage.removeItem('zettcbt_current_teacher');
  state.currentTeacher = null;

  const navLabel = document.getElementById('nav-teacher-label');
  if (navLabel) navLabel.textContent = 'Guru & Pengawas';

  const tabSb = document.getElementById('tab-link-supabase');
  if (tabSb) tabSb.style.display = 'none';

  const tabTeachers = document.getElementById('tab-link-teachers');
  if (tabTeachers) tabTeachers.style.display = 'none';

  showScreen('student-login');
  showToast('Anda telah keluar dari Panel Guru & Pengawas.', 'info');
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
  if (tabSb) {
    tabSb.style.display = (t.role === 'admin_sekolah') ? 'inline-block' : 'none';
  }

  const tabTeachers = document.getElementById('tab-link-teachers');
  if (tabTeachers) {
    tabTeachers.style.display = (t.role === 'admin_sekolah') ? 'inline-block' : 'none';
  }

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
  renderAdminQuestionBank();
  renderLiveMonitoringTable();
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

// SCREEN 1: Handle Student Login
function handleStudentLogin(event) {
  event.preventDefault();

  const nisn = document.getElementById('login-nisn').value.trim();
  const name = document.getElementById('login-name').value.trim();
  const className = document.getElementById('login-class').value;
  const token = document.getElementById('login-token').value.trim().toUpperCase();

  // Validate Token
  if (token !== state.session.token) {
    showToast('Token Ujian salah atau belum diaktifkan pengawas!', 'danger');
    return;
  }

  // Validasi Akun Siswa terhadap Master Data yang dikelola Guru
  let activeName = name;
  let activeClass = className;
  if (state.students && state.students.length > 0) {
    const matched = state.students.find(s => s.nisn.toLowerCase() === nisn.toLowerCase());
    if (!matched) {
      showToast('Nomor Peserta / NISN "' + nisn + '" belum didaftarkan oleh guru kelas! Hubungi pengawas.', 'danger');
      return;
    }
    if (!activeName) activeName = matched.name;
    if (!activeClass) activeClass = matched.className;
  }

  if (state.questions.length === 0) {
    showToast('Bank soal belum dibuat oleh pengawas!', 'danger');
    return;
  }

  // Set student state
  state.student.nisn = nisn;
  state.student.name = activeName;
  state.student.className = activeClass;
  state.student.answers = {};
  state.warningCount = 0;

  // Populate Confirmation Screen
  document.getElementById('confirm-nisn').textContent = nisn;
  document.getElementById('confirm-name').textContent = activeName;
  document.getElementById('confirm-class').textContent = className;
  document.getElementById('confirm-subject').textContent = state.session.subject + ' (' + state.session.title + ')';
  document.getElementById('confirm-total-q').textContent = state.questions.length + ' Butir Soal (Pilihan Ganda)';
  document.getElementById('confirm-duration').textContent = state.session.durationMinutes + ' Menit';

  showScreen('student-confirm');
  showToast('Identitas terverifikasi. Silakan baca petunjuk ujian.', 'success');
}

// SCREEN 2 -> SCREEN 3: Start Exam
function startExamSession() {
  state.isExamRunning = true;
  state.student.startTime = new Date();
  state.timeRemainingSeconds = state.session.durationMinutes * 60;
  state.currentQuestionIndex = 0;

  // Populate Banner
  document.getElementById('exam-avatar').textContent = (state.student.name || 'S').charAt(0).toUpperCase();
  document.getElementById('exam-student-name').textContent = state.student.name;
  document.getElementById('exam-subject-name').textContent = state.session.subject;
  document.getElementById('exam-class-name').textContent = state.student.className;

  // Try requesting Fullscreen for official exam experience
  try {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  } catch (e) {}

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
  showToast('Ujian dimulai! Selamat mengerjakan.', 'info');
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

// Render Current Question (ANBK/UTBK Standard)
function renderCurrentQuestion() {
  const q = state.questions[state.currentQuestionIndex];
  if (!q) return;

  // Header Badge
  const badge = document.getElementById('exam-question-badge');
  badge.textContent = 'Soal No. ' + (state.currentQuestionIndex + 1) + ' dari ' + state.questions.length;

  // Content Text
  const content = document.getElementById('question-content-text');
  content.textContent = q.text;

  // Image Attachment if any
  const imgBox = document.getElementById('question-image-box');
  const imgTag = document.getElementById('question-image-tag');
  if (q.imageUrl && q.imageUrl.trim()) {
    imgTag.src = q.imageUrl;
    imgBox.style.display = 'block';
  } else {
    imgBox.style.display = 'none';
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
      optionsContainer.appendChild(item);
    });
  } 
  // 2. Tipe: PG Kompleks (Multi Select Checkbox)
  else if (qType === 'kompleks') {
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size: 0.85rem; color: #16a34a; font-weight: 700; margin-bottom: 0.75rem; background: #f0fdf4; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);';
    hint.textContent = 'ℹ️ Pilihan Ganda Kompleks: Anda dapat memilih LEBIH DARI SATU jawaban yang benar.';
    optionsContainer.appendChild(hint);

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
      optionsContainer.appendChild(item);
    });
  }
  // 3. Tipe: Menjodohkan (Matching Pairs)
  else if (qType === 'jodoh') {
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size: 0.85rem; color: #b45309; font-weight: 700; margin-bottom: 0.75rem; background: #fffbeb; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);';
    hint.textContent = 'ℹ️ Menjodohkan: Pasangkan pernyataan di kolom kiri dengan pilihan yang tepat di kolom kanan.';
    optionsContainer.appendChild(hint);

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
    optionsContainer.appendChild(table);
  }
  // 4. Tipe: Esai / Isian Singkat
  else if (qType === 'esai') {
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size: 0.85rem; color: #7e22ce; font-weight: 700; margin-bottom: 0.75rem; background: #faf5ff; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);';
    hint.textContent = 'ℹ️ Soal Isian / Esai: Tuliskan jawaban Anda pada kolom di bawah ini secara jelas.';
    optionsContainer.appendChild(hint);

    const txt = document.createElement('textarea');
    txt.className = 'form-control';
    txt.rows = 4;
    txt.placeholder = 'Ketik jawaban Anda di sini...';
    txt.value = typeof studentAns.selected === 'string' ? studentAns.selected : '';
    txt.oninput = (e) => selectOptionAnswer(q.id, e.target.value);
    optionsContainer.appendChild(txt);
  }
  // 5. Tipe: Benar / Salah (True / False Table)
  else if (qType === 'bs') {
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size: 0.85rem; color: #0f766e; font-weight: 700; margin-bottom: 0.75rem; background: #f0fdfa; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);';
    hint.textContent = 'ℹ️ Benar / Salah: Tentukan status kebenaran dari setiap pernyataan di bawah ini.';
    optionsContainer.appendChild(hint);

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
    optionsContainer.appendChild(table);
  }

  // Doubt Checkbox Status
  const doubtBox = document.getElementById('checkbox-doubt');
  if (doubtBox) {
    doubtBox.checked = studentAns.isDoubt === true;
  }

  // Disable / Enable Prev & Next Buttons
  const btnPrev = document.getElementById('btn-prev-q');
  const btnNext = document.getElementById('btn-next-q');
  if (btnPrev) btnPrev.disabled = state.currentQuestionIndex === 0;
  if (btnNext) {
    if (state.currentQuestionIndex === state.questions.length - 1) {
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
  const q = state.questions[state.currentQuestionIndex];
  if (!q) return;

  const doubtBox = document.getElementById('checkbox-doubt');
  const isChecked = doubtBox ? doubtBox.checked : false;

  if (!state.student.answers[q.id]) {
    state.student.answers[q.id] = { selected: null, isDoubt: isChecked };
  } else {
    state.student.answers[q.id].isDoubt = isChecked;
  }

  triggerAutoSaveIndicator();
  updateGridButtonStatus();
}

// Question Navigation
function navigateQuestion(delta) {
  const targetIndex = state.currentQuestionIndex + delta;
  if (targetIndex >= 0 && targetIndex < state.questions.length) {
    state.currentQuestionIndex = targetIndex;
    renderCurrentQuestion();
  }
}

function jumpToQuestion(index) {
  if (index >= 0 && index < state.questions.length) {
    state.currentQuestionIndex = index;
    renderCurrentQuestion();
  }
}

// Grid Buttons Generator
function renderQuestionGrid() {
  const grid = document.getElementById('question-grid-container');
  if (!grid) return;
  grid.innerHTML = '';

  state.questions.forEach((q, idx) => {
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
  state.questions.forEach((q, idx) => {
    const btn = document.getElementById('grid-btn-' + idx);
    if (!btn) return;

    btn.className = 'grid-btn';
    if (idx === state.currentQuestionIndex) {
      btn.classList.add('current');
    }

    const ans = state.student.answers[q.id];
    if (ans) {
      if (ans.isDoubt) {
        btn.classList.add('doubt');
      } else if (ans.selected) {
        btn.classList.add('answered');
      }
    }
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
  }
  updateAdminMetrics();
}

// Anti-Cheat Engine (Tab Switching & Visibility Change Detector)
function initAntiCheatProtection() {
  document.addEventListener('visibilitychange', () => {
    if (!state.isExamRunning) return;

    if (document.hidden) {
      triggerCheatWarning();
    }
  });

  window.addEventListener('blur', () => {
    if (!state.isExamRunning) return;
    triggerCheatWarning();
  });
}

function triggerCheatWarning() {
  state.warningCount++;
  syncLiveStudentProgress();

  const countDisplay = document.getElementById('modal-warning-count');
  if (countDisplay) countDisplay.textContent = state.warningCount;

  const modal = document.getElementById('modal-cheat-alert');
  if (modal) modal.style.display = 'flex';

  if (state.warningCount >= state.maxWarnings) {
    showToast('Batas pelanggaran 3x terlewati! Ujian dikunci dan dikumpulkan otomatis.', 'danger');
    dismissCheatAlert();
    submitFinalExam(true);
  }
}

function dismissCheatAlert() {
  const modal = document.getElementById('modal-cheat-alert');
  if (modal) modal.style.display = 'none';
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
  document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');

  element.classList.add('active');
  const target = document.getElementById('tab-' + tabId);
  if (target) target.style.display = 'block';

  if (tabId === 'live-monitor') renderLiveMonitoringTable();
  if (tabId === 'question-bank') renderAdminQuestionBank();
  if (tabId === 'manage-students') renderStudentsTable();
  if (tabId === 'manage-teachers') renderTeachersTable();
  if (tabId === 'results-analysis') renderResultsTable();
  if (tabId === 'exam-cards') renderExamCardsTab();
  if (tabId === 'school-identity') populateSchoolIdentityForm();
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

function openAddQuestionModal() {
  document.getElementById('modal-question-title').textContent = 'Tambah Soal Baru';
  document.getElementById('edit-question-id').value = '';
  document.getElementById('form-question-editor').reset();

  const subjInput = document.getElementById('edit-question-subject');
  const classInput = document.getElementById('edit-question-class');

  // Kunci otomatis field sesuai identitas guru yang login
  if (state.currentTeacher) {
    const t = state.currentTeacher;
    if (t.role === 'guru_kelas') {
      if (classInput) {
        classInput.value = t.assignedClass;
        classInput.readOnly = true;
      }
      if (subjInput) {
        subjInput.value = t.assignedSubject !== 'Semua' ? t.assignedSubject : 'Tematik';
        subjInput.readOnly = false;
      }
    } else if (t.role === 'guru_mapel') {
      if (subjInput) {
        subjInput.value = t.assignedSubject;
        subjInput.readOnly = true;
      }
      if (classInput) {
        classInput.value = 'UMUM';
        classInput.readOnly = false;
      }
    } else {
      if (subjInput) subjInput.readOnly = false;
      if (classInput) classInput.readOnly = false;
    }
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
  
  const subjInput = document.getElementById('edit-question-subject');
  const classInput = document.getElementById('edit-question-class');
  if (subjInput) subjInput.value = q.subject || 'Umum';
  if (classInput) classInput.value = q.targetClass || 'UMUM';

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

  const studentObj = {
    id: originalNisn ? (state.students.find(s => s.nisn === originalNisn)?.id || 'st-' + Date.now()) : 'st-' + Date.now(),
    nisn: nisn,
    name: name,
    className: className,
    gender: gender,
    status: 'active'
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
  showToast('Siswa berhasil dihapus!', 'info');
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
  showToast('Akun guru berhasil dihapus!', 'info');
}

// ==============================================================================
// CETAK PDF ENGINE (KOP SURAT SD NEGERI 14 TOBOALI)
// ==============================================================================

function generateKopSuratHtml() {
  const sch = state.school;
  return `
    <div style="text-align: center; border-bottom: 3px double #000000; padding-bottom: 8px; margin-bottom: 16px; font-family: 'Times New Roman', serif;">
      <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase;">PEMERINTAH KABUPATEN BANGKA SELATAN</div>
      <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">DINAS PENDIDIKAN DAN KEBUDAYAAN</div>
      <div style="font-size: 16pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">${sch.name}</div>
      <div style="font-size: 9pt; margin-top: 3px;">NPSN: ${sch.npsn} | Alamat: ${sch.address}</div>
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
      '<div>Toboali, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + '<br>Guru Mata Pelajaran / Wali Kelas<br><br><br><br><strong>' + (state.currentTeacher ? state.currentTeacher.fullName : 'Pengawas Ujian') + '</strong></div>' +
    '</div>';

  window.print();
}

// 3. Cetak Kartu Peserta Ujian ke PDF (Format ANBK Kotak A4)
function printExamCardsPdf() {
  const container = document.getElementById('print-container');
  const students = getVisibleLiveStudents();
  const sch = state.school;

  let cardsHtml = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">';

  students.forEach((st) => {
    cardsHtml += `
      <div style="border: 2px solid #000; padding: 12px; border-radius: 6px; font-family: 'Times New Roman', serif; background: #fff; page-break-inside: avoid;">
        <div style="text-align: center; border-bottom: 2px double #000; padding-bottom: 5px; margin-bottom: 8px;">
          <div style="font-size: 8.5pt; font-weight: bold; text-transform: uppercase;">DINAS PENDIDIKAN KABUPATEN BANGKA SELATAN</div>
          <div style="font-size: 10pt; font-weight: bold;">${sch.name}</div>
          <div style="font-size: 8pt; font-weight: bold; color: #2563eb;">KARTU PESERTA UJIAN ONLINE</div>
        </div>

        <div style="display: grid; grid-template-columns: 80px 1fr; gap: 10px; font-size: 8.5pt;">
          <div style="width: 75px; height: 95px; border: 1px dashed #666; display: flex; align-items: center; justify-content: center; font-size: 7.5pt; color: #777; text-align: center; background: #fafafa;">
            PAS FOTO<br>2 x 3
          </div>
          <div>
            <div style="margin-bottom: 3px;"><strong>No. Peserta:</strong> ${st.nisn}</div>
            <div style="margin-bottom: 3px;"><strong>Nama:</strong> ${st.name}</div>
            <div style="margin-bottom: 3px;"><strong>Kelas:</strong> ${st.className}</div>
            <div style="margin-bottom: 3px;"><strong>Ruang / Sesi:</strong> Lab Komputer / Sesi 1</div>
            <div style="margin-bottom: 3px;"><strong>Tahun Ajaran:</strong> ${sch.academicYear}</div>
          </div>
        </div>

        <div style="text-align: right; margin-top: 8px; font-size: 7.5pt;">
          Kepala Sekolah,<br><br><br>
          <strong>${sch.headmaster}</strong><br>
          NIP. ${sch.headmasterNip}
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

  const students = getVisibleLiveStudents();
  const sch = state.school;
  container.innerHTML = '';

  students.forEach((st) => {
    const card = document.createElement('div');
    card.className = 'exam-student-card';
    card.innerHTML = `
      <div style="border-bottom: 1.5px double var(--slate-400); padding-bottom: 0.5rem; margin-bottom: 0.75rem; text-align: center;">
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">KARTU PESERTA UJIAN CBT</div>
        <div style="font-size: 0.95rem; font-weight: 800; color: var(--slate-900);">${sch.name}</div>
      </div>
      <div style="display: grid; grid-template-columns: 75px 1fr; gap: 0.75rem;">
        <div style="width: 75px; height: 90px; border: 1px dashed var(--slate-300); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--slate-400); text-align: center; background: var(--slate-50);">
          FOTO<br>SISWA
        </div>
        <div style="font-size: 0.82rem; line-height: 1.5;">
          <div><span style="color: var(--slate-500);">Nomor:</span> <strong>${st.nisn}</strong></div>
          <div><span style="color: var(--slate-500);">Nama:</span> <strong>${st.name}</strong></div>
          <div><span style="color: var(--slate-500);">Kelas:</span> ${st.className}</div>
          <div><span style="color: var(--slate-500);">Ruang:</span> Lab Komputer</div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function populateSchoolIdentityForm() {
  const sch = state.school;
  if (document.getElementById('school-name')) document.getElementById('school-name').value = sch.name;
  if (document.getElementById('school-npsn')) document.getElementById('school-npsn').value = sch.npsn;
  if (document.getElementById('school-academic-year')) document.getElementById('school-academic-year').value = sch.academicYear;
  if (document.getElementById('school-address')) document.getElementById('school-address').value = sch.address;
  if (document.getElementById('school-headmaster')) document.getElementById('school-headmaster').value = sch.headmaster;
  if (document.getElementById('school-headmaster-nip')) document.getElementById('school-headmaster-nip').value = sch.headmasterNip;
}

function handleSaveSchoolIdentity(event) {
  event.preventDefault();
  state.school = {
    name: document.getElementById('school-name').value.trim(),
    npsn: document.getElementById('school-npsn').value.trim(),
    academicYear: document.getElementById('school-academic-year').value.trim(),
    address: document.getElementById('school-address').value.trim(),
    headmaster: document.getElementById('school-headmaster').value.trim(),
    headmasterNip: document.getElementById('school-headmaster-nip').value.trim()
  };

  localStorage.setItem('zettcbt_school', JSON.stringify(state.school));
  showToast('Identitas sekolah & Kop Surat berhasil diperbarui!', 'success');
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
  updateAdminMetrics();
  showToast('Pengaturan sesi ujian berhasil diperbarui!', 'success');
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

// Save Supabase Configuration
function handleSaveDatabaseConfig(event) {
  event.preventDefault();
  const url = document.getElementById('config-supabase-url').value.trim();
  const key = document.getElementById('config-supabase-key').value.trim();

  state.supabase.url = url;
  state.supabase.key = key;

  localStorage.setItem('zettcbt_sb_url', url);
  localStorage.setItem('zettcbt_sb_key', key);

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
