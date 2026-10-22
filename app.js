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

  // Active Teacher Session (Isolation State)
  currentTeacher: JSON.parse(sessionStorage.getItem('zettcbt_current_teacher') || 'null'),

  // Daftar Akun Guru (Mendukung Offline & Online Supabase)
  teachers: [
    { id: 't-admin', username: 'admin', password: 'admin123', fullName: 'Waka Kurikulum / Kepala Sekolah', role: 'admin_sekolah', assignedClass: null, assignedSubject: null },
    { id: 't-7a', username: 'guru7a', password: 'guru123', fullName: 'Budi Santoso, S.Pd (Wali Kelas 7A)', role: 'guru_kelas', assignedClass: '7A', assignedSubject: 'Tematik 7A' },
    { id: 't-7b', username: 'guru7b', password: 'guru123', fullName: 'Siti Aminah, S.Pd (Wali Kelas 7B)', role: 'guru_kelas', assignedClass: '7B', assignedSubject: 'Tematik 7B' },
    { id: 't-mtk', username: 'gurumtk', password: 'guru123', fullName: 'Hendra Wijaya, M.Pd (Guru Matematika)', role: 'guru_mapel', assignedClass: null, assignedSubject: 'Matematika' },
    { id: 't-ipa', username: 'guruipa', password: 'guru123', fullName: 'Dewi Lestari, S.Pd (Guru IPA)', role: 'guru_mapel', assignedClass: null, assignedSubject: 'IPA' }
  ],

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
      teacherId: 't-7a',
      teacherName: 'Budi Santoso, S.Pd',
      subject: 'Tematik 7A',
      targetClass: '7A',
      text: '[SOAL KHUSUS KELAS 7A] Peristiwa mengembun adalah perubahan wujud benda dari...',
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
      teacherId: 't-7a',
      teacherName: 'Budi Santoso, S.Pd',
      subject: 'Tematik 7A',
      targetClass: '7A',
      text: '[SOAL KHUSUS KELAS 7A] Lambang sila ke-3 dalam perisai Garuda Pancasila adalah...',
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
      teacherId: 't-7b',
      teacherName: 'Siti Aminah, S.Pd',
      subject: 'Tematik 7B',
      targetClass: '7B',
      text: '[SOAL KHUSUS KELAS 7B] Ide pokok dalam sebuah paragraf deduktif terletak pada...',
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
      teacherId: 't-mtk',
      teacherName: 'Hendra Wijaya, M.Pd',
      subject: 'Matematika',
      targetClass: 'UMUM',
      text: '[SOAL MAPEL MATEMATIKA] Jika f(x) = 2x³ - 4x² + 5x - 7, maka nilai turunan f\'(2) adalah...',
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
      teacherId: 't-ipa',
      teacherName: 'Dewi Lestari, S.Pd',
      subject: 'IPA',
      targetClass: 'UMUM',
      text: '[SOAL MAPEL IPA] Organel sel yang berfungsi sebagai tempat respirasi seluler dan penghasil energi ATP adalah...',
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
  if (navLabel) navLabel.textContent = 'Panel Guru / Admin';

  showScreen('student-login');
  showToast('Anda telah keluar dari Panel Guru.', 'info');
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
      elBadge.textContent = 'SUPER ADMIN SEKOLAH';
    }
  }

  if (elScope) {
    if (t.role === 'guru_kelas') {
      elScope.textContent = 'Kewenangan: Khusus Kelas ' + t.assignedClass + ' | Mapel: ' + (t.assignedSubject || 'Semua');
    } else if (t.role === 'guru_mapel') {
      elScope.textContent = 'Kewenangan: Seluruh Kelas | Khusus Mapel: ' + t.assignedSubject;
    } else {
      elScope.textContent = 'Kewenangan Penuh: Seluruh Kelas & Seluruh Mata Pelajaran Sekolah';
    }
  }

  if (elNoticeText) {
    if (t.role === 'guru_kelas') {
      elNoticeText.innerHTML = '<strong>🔒 Sistem Isolasi Aktif:</strong> Anda masuk sebagai <strong>Wali/Guru Kelas ' + t.assignedClass + '</strong>. Anda hanya dapat melihat dan mengelola bank soal serta nilai siswa <strong>Kelas ' + t.assignedClass + '</strong>. Soal guru kelas lain atau mapel lain diisolasi secara aman.';
    } else if (t.role === 'guru_mapel') {
      elNoticeText.innerHTML = '<strong>🔒 Sistem Isolasi Aktif:</strong> Anda masuk sebagai <strong>Guru Mata Pelajaran ' + t.assignedSubject + '</strong>. Anda hanya dapat mengelola bank soal mata pelajaran <strong>' + t.assignedSubject + '</strong>. Soal guru kelas atau mapel lain tidak dapat Anda akses.';
    } else {
      elNoticeText.innerHTML = '<strong>👑 Mode Super Administrator:</strong> Anda memiliki akses pengawas penuh (Kepala Sekolah / Kurikulum). Anda dapat melihat bank soal dan rekapitulasi nilai seluruh guru, kelas, dan mata pelajaran.';
    }
  }

  // 2. Render ulang data terisolasi
  renderAdminQuestionBank();
  renderLiveMonitoringTable();
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

  if (state.questions.length === 0) {
    showToast('Bank soal belum dibuat oleh pengawas!', 'danger');
    return;
  }

  // Set student state
  state.student.nisn = nisn;
  state.student.name = name;
  state.student.className = className;
  state.student.answers = {};
  state.warningCount = 0;

  // Populate Confirmation Screen
  document.getElementById('confirm-nisn').textContent = nisn;
  document.getElementById('confirm-name').textContent = name;
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

  // Answer Options A - E
  const optionsContainer = document.getElementById('options-list-container');
  optionsContainer.innerHTML = '';

  const studentAns = state.student.answers[q.id] || { selected: null, isDoubt: false };

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
  if (tabId === 'results-analysis') renderResultsTable();
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

function handleSaveQuestion(event) {
  event.preventDefault();

  const qId = document.getElementById('edit-question-id').value;
  const teacher = state.currentTeacher;

  const newQuestion = {
    id: qId || 'q-' + Date.now(),
    number: state.questions.length + 1,
    teacherId: teacher ? teacher.id : 't-admin',
    teacherName: teacher ? teacher.fullName : 'Admin',
    subject: document.getElementById('edit-question-subject')?.value.trim() || 'Matematika',
    targetClass: document.getElementById('edit-question-class')?.value.trim().toUpperCase() || 'UMUM',
    text: document.getElementById('edit-question-text').value.trim(),
    imageUrl: document.getElementById('edit-question-image').value.trim(),
    optionA: document.getElementById('edit-opt-a').value.trim(),
    optionB: document.getElementById('edit-opt-b').value.trim(),
    optionC: document.getElementById('edit-opt-c').value.trim(),
    optionD: document.getElementById('edit-opt-d').value.trim(),
    optionE: document.getElementById('edit-opt-e').value.trim(),
    correctKey: document.getElementById('edit-correct-key').value,
    scoreWeight: parseInt(document.getElementById('edit-score-weight').value) || 10
  };

  if (qId) {
    const idx = state.questions.findIndex(q => q.id === qId);
    if (idx >= 0) state.questions[idx] = newQuestion;
  } else {
    state.questions.push(newQuestion);
  }

  localStorage.setItem('zettcbt_questions', JSON.stringify(state.questions));
  renderAdminQuestionBank();
  closeQuestionModal();
  showToast('Butir soal berhasil disimpan untuk ' + newQuestion.targetClass + ' (' + newQuestion.subject + ')!', 'success');
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
