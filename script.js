/* ================================================
   CapMinds – Appointment Scheduler  |  script.js
   ================================================ */

/* ── SEED DATA ─────────────────────────────────── */
const PRESET_PATIENTS = [
    { name: 'Henry James', color: '#1a73e8' },
    { name: 'Sarah Connor', color: '#e67e22' },
    { name: 'Michael Brown', color: '#8e44ad' },
    { name: 'Emily Davis', color: '#16a085' },
    { name: 'Robert Wilson', color: '#c0392b' },
    { name: 'Jessica Taylor', color: '#2980b9' },
    { name: 'David Martinez', color: '#27ae60' },
    { name: 'Amanda White', color: '#d35400' },
];

const PRESET_DOCTORS = [
    { name: 'James Marry', color: '#1a73e8' },
    { name: 'Dr. Sarah Lee', color: '#8e44ad' },
    { name: 'Dr. Alan Grant', color: '#16a085' },
    { name: 'Dr. Nina Patel', color: '#e67e22' },
    { name: 'Dr. Chris Evans', color: '#c0392b' },
    { name: 'Dr. Priya Shah', color: '#2980b9' },
];

/* ── STATE ──────────────────────────────────────── */
let appointments = JSON.parse(localStorage.getItem('capminds_appts') || '[]');
let editingId = null;
let currentYear = 2023;
let currentMonth = 0; // January

function saveStorage() {
    localStorage.setItem('capminds_appts', JSON.stringify(appointments));
}
function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ── NAVIGATION ─────────────────────────────────── */
function showPage(page) {
    document.getElementById('page-calendar').style.display = page === 'calendar' ? 'flex' : 'none';
    document.getElementById('page-dashboard').style.display = page === 'dashboard' ? 'flex' : 'none';

    ['calendar', 'dashboard'].forEach(p => {
        const ni = document.getElementById('nav-' + p);
        const bi = document.getElementById('bn-' + p);
        if (ni) ni.classList.toggle('active', p === page);
        if (bi) bi.classList.toggle('active', p === page);
    });

    if (page === 'dashboard') renderTable();
}

/* ── SIDEBAR ────────────────────────────────────── */
let sidebarCollapsed = false;
function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    document.getElementById('sidebar').classList.toggle('collapsed', sidebarCollapsed);
    document.getElementById('sidebar-toggle').innerHTML = sidebarCollapsed ? '&#187;' : '&#171;';
}

/* ── CALENDAR ───────────────────────────────────── */
const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function buildCalendarHeader() {
    const thead = document.getElementById('cal-head');
    thead.innerHTML = '<tr>' + DAY_NAMES.map((d, i) =>
        `<th class="${i === 5 ? 'friday' : ''}">${d}</th>`
    ).join('') + '</tr>';
}

function renderCalendar() {
    const titleEl = document.getElementById('cal-title');
    // Show "Month Day, Year" using today's date if viewing current month, else 1st of month
    const today = new Date();
    const isCurrentMonth = (currentYear === today.getFullYear() && currentMonth === today.getMonth());
    const displayDate = isCurrentMonth
        ? new Date(currentYear, currentMonth, today.getDate())
        : new Date(currentYear, currentMonth, 1);
    titleEl.textContent = displayDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrev = new Date(currentYear, currentMonth, 0).getDate();

    const tbody = document.getElementById('cal-body');
    tbody.innerHTML = '';

    let dayNum = 1;
    let nextDay = 1;
    let prevDay = daysInPrev - firstDay + 1;

    for (let row = 0; row < 6; row++) {
        const tr = document.createElement('tr');
        let rowHasCurrentMonth = false;

        for (let col = 0; col < 7; col++) {
            const td = document.createElement('td');
            td.className = 'cal-cell';

            let cellDate;
            let isOther = false;

            if (row === 0 && col < firstDay) {
                cellDate = new Date(currentYear, currentMonth - 1, prevDay++);
                isOther = true;
            } else if (dayNum > daysInMonth) {
                cellDate = new Date(currentYear, currentMonth + 1, nextDay++);
                isOther = true;
            } else {
                cellDate = new Date(currentYear, currentMonth, dayNum++);
                rowHasCurrentMonth = true;
            }

            if (isOther) td.classList.add('other-month');

            const isToday = cellDate.toDateString() === today.toDateString();
            if (isToday) td.classList.add('today');

            // Date number (with month prefix for first visible of each month)
            const dateDiv = document.createElement('div');
            dateDiv.className = 'cell-date';

            const d = cellDate.getDate();
            const isFirstOfMonth = d === 1;
            if (isFirstOfMonth) {
                const m = cellDate.toLocaleString('en-US', { month: 'short' });
                dateDiv.textContent = m + ' ' + d;
                dateDiv.style.width = 'auto';
                dateDiv.style.fontSize = '11px';
                dateDiv.style.borderRadius = '4px';
                dateDiv.style.paddingRight = '4px';
            } else {
                dateDiv.textContent = d;
            }
            td.appendChild(dateDiv);

            // Appointment chips
            const dateStr = fmtDate(cellDate);
            const dayAppts = appointments.filter(a => a.date === dateStr);
            dayAppts.forEach(appt => td.appendChild(buildChip(appt)));

            // Click to open booking
            td.addEventListener('click', e => {
                if (!e.target.closest('.appt-chip')) openModal(null, dateStr);
            });

            tr.appendChild(td);
        }

        tbody.appendChild(tr);
        // Stop after 5 rows if current month is done and row had no current-month day
        if (row >= 4 && !rowHasCurrentMonth) break;
    }
}

function buildChip(appt) {
    const chip = document.createElement('div');
    chip.className = 'appt-chip';
    chip.dataset.id = appt.id;

    const timeStr = appt.timeStart ? fmt12(appt.timeStart) : '';
    // Always green to match Figma design
    chip.style.background = '#4caf50';

    chip.innerHTML = `
    <div class="appt-chip-text">
      <span class="appt-chip-name">&#9993; ${esc(appt.patientName)} (Arrived) ${timeStr}</span>
    </div>
    <div class="chip-actions">
      <button class="chip-btn" title="Edit"   onclick="event.stopPropagation();editAppt('${appt.id}')">&#9998;</button>
      <button class="chip-btn" title="Copy"   onclick="event.stopPropagation();copyAppt('${appt.id}')">&#128203;</button>
      <button class="chip-btn" title="Delete" onclick="event.stopPropagation();deleteAppt('${appt.id}')">&#128465;</button>
    </div>`;
    return chip;
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
}
function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
}
function goToday() {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    renderCalendar();
}
function onViewChange(v) {
    // Week view placeholder — falls back to month
    if (v === 'week') {
        document.getElementById('view-select').value = 'month';
        showToast('Week view coming soon!');
    }
}

/* ── MODAL ──────────────────────────────────────── */
function openModal(id = null, prefillDate = null) {
    clearForm();
    editingId = id;

    if (id) {
        const a = appointments.find(x => x.id === id);
        if (a) {
            document.getElementById('f-patient').value = a.patientName || '';
            document.getElementById('f-doctor').value = a.doctorName || '';
            document.getElementById('f-hospital').value = a.hospital || '';
            document.getElementById('f-specialty').value = a.specialty || '';
            document.getElementById('f-date').value = a.date || '';
            document.getElementById('f-time-start').value = a.timeStart || '';
            document.getElementById('f-time-end').value = a.timeEnd || '';
            document.getElementById('f-reason').value = a.reason || '';
        }
        document.getElementById('modal-title').textContent = 'Edit Appointment';
    } else {
        document.getElementById('modal-title').textContent = 'Schedule Appointment';
        if (prefillDate) document.getElementById('f-date').value = prefillDate;
    }

    document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    editingId = null;
}

// Close on overlay backdrop click
document.getElementById('modal-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

function clearForm() {
    const ids = ['f-patient', 'f-doctor', 'f-hospital', 'f-specialty', 'f-date', 'f-time-start', 'f-time-end', 'f-reason'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.classList.remove('err'); }
    });
    const errIds = ['err-patient', 'err-doctor', 'err-hospital', 'err-specialty', 'err-date', 'err-time'];
    errIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('show');
    });
}

/* ── AUTO-FILL end time ─── */
function syncEndTime() {
    const start = document.getElementById('f-time-start').value;
    if (!start) return;
    const [h, m] = start.split(':').map(Number);
    const total = h * 60 + m + 15;
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    document.getElementById('f-time-end').value =
        `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

/* ── SAVE ───────────────────────────────────────── */
function saveAppointment() {
    const patient = document.getElementById('f-patient').value.trim();
    const doctor = document.getElementById('f-doctor').value.trim();
    const hospital = document.getElementById('f-hospital').value;
    const specialty = document.getElementById('f-specialty').value;
    const date = document.getElementById('f-date').value;
    const timeStart = document.getElementById('f-time-start').value;
    const timeEnd = document.getElementById('f-time-end').value;
    const reason = document.getElementById('f-reason').value.trim();

    // Validate
    let valid = true;
    const checks = [
        ['f-patient', 'err-patient', patient],
        ['f-doctor', 'err-doctor', doctor],
        ['f-hospital', 'err-hospital', hospital],
        ['f-specialty', 'err-specialty', specialty],
        ['f-date', 'err-date', date],
        ['f-time-start', 'err-time', timeStart],
    ];
    checks.forEach(([fid, eid, val]) => {
        const fEl = document.getElementById(fid);
        const eEl = document.getElementById(eid);
        if (!val) {
            fEl && fEl.classList.add('err');
            eEl && eEl.classList.add('show');
            valid = false;
        } else {
            fEl && fEl.classList.remove('err');
            eEl && eEl.classList.remove('show');
        }
    });
    if (!valid) return;

    if (editingId) {
        const idx = appointments.findIndex(a => a.id === editingId);
        if (idx > -1) {
            appointments[idx] = {
                ...appointments[idx],
                patientName: patient, doctorName: doctor,
                hospital, specialty, date, timeStart, timeEnd, reason,
            };
        }
        showToast('Appointment updated!');
    } else {
        appointments.push({
            id: genId(),
            patientName: patient, doctorName: doctor,
            hospital, specialty, date, timeStart, timeEnd, reason,
        });
        showToast('Appointment saved!');
    }

    saveStorage();
    closeModal();
    renderCalendar();
    updateDoctorLabel();
    if (document.getElementById('page-dashboard').style.display !== 'none') renderTable();
}

/* ── EDIT / DELETE / COPY ─── */
function editAppt(id) { openModal(id); }

function deleteAppt(id) {
    if (!confirm('Delete this appointment?')) return;
    appointments = appointments.filter(a => a.id !== id);
    saveStorage();
    renderCalendar();
    renderTable();
    showToast('Appointment deleted.');
}

function copyAppt(id) {
    const a = appointments.find(x => x.id === id);
    if (!a) return;
    appointments.push({ ...a, id: genId() });
    saveStorage();
    renderCalendar();
    renderTable();
    showToast('Appointment duplicated.');
}

/* ── AUTOCOMPLETE ───────────────────────────────── */
let acTimers = {};

function acShow(type) {
    clearTimeout(acTimers[type]);
    const input = document.getElementById('f-' + type);
    const dropdown = document.getElementById('ac-' + type);
    const query = input.value.trim().toLowerCase();
    const list = type === 'patient' ? PRESET_PATIENTS : PRESET_DOCTORS;

    const filtered = list.filter(item =>
        !query || item.name.toLowerCase().includes(query)
    );

    if (!filtered.length) { dropdown.classList.remove('show'); return; }

    dropdown.innerHTML = filtered.map(item => {
        const initials = item.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        return `
      <div class="ac-item" onmousedown="acSelect('${type}','${item.name.replace(/'/g, "\\'")}')">
        <div class="ac-avatar" style="background:${item.color}">${initials}</div>
        <span>${esc(item.name)}</span>
      </div>`;
    }).join('');

    dropdown.classList.add('show');
}

function acFilter(type) {
    acShow(type);
}

function acHide(type, delay) {
    acTimers[type] = setTimeout(() => {
        const dropdown = document.getElementById('ac-' + type);
        if (dropdown) dropdown.classList.remove('show');
    }, delay || 200);
}

function acSelect(type, value) {
    document.getElementById('f-' + type).value = value;
    const dropdown = document.getElementById('ac-' + type);
    if (dropdown) dropdown.classList.remove('show');
}

/* ── DASHBOARD TABLE ─────────────────────────────── */
function renderTable() {
    const pSearch = (document.getElementById('search-patient').value || '').toLowerCase();
    const dSearch = (document.getElementById('search-doctor').value || '').toLowerCase();
    const fromVal = document.getElementById('filter-from').value;
    const toVal = document.getElementById('filter-to').value;

    const filtered = appointments.filter(a => {
        if (pSearch && !a.patientName.toLowerCase().includes(pSearch)) return false;
        if (dSearch && !a.doctorName.toLowerCase().includes(dSearch)) return false;
        if (fromVal && a.date < fromVal) return false;
        if (toVal && a.date > toVal) return false;
        return true;
    });

    const tbody = document.getElementById('appt-tbody');
    if (!filtered.length) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No appointments found.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(a => {
        const timeRange = a.timeStart
            ? `${fmt12(a.timeStart)}${a.timeEnd ? ' - ' + fmt12(a.timeEnd) : ''}`
            : '—';
        return `
      <tr>
        <td><a class="link-blue" href="#">${esc(a.patientName)}</a></td>
        <td><a class="link-blue" href="#">${esc(a.doctorName)}</a></td>
        <td>${esc(a.hospital)}</td>
        <td>${esc(a.specialty)}</td>
        <td>${fmtDisplay(a.date)}</td>
        <td><span class="time-blue">${timeRange}</span></td>
        <td>
          <div class="action-btns">
            <button class="icon-btn edit" title="Edit"   onclick="editAppt('${a.id}')">&#9998;</button>
            <button class="icon-btn del"  title="Delete" onclick="deleteAppt('${a.id}')">&#128465;</button>
          </div>
        </td>
      </tr>`;
    }).join('');
}

function applyFilters() { renderTable(); }

/* ── HELPERS ────────────────────────────────────── */
function fmtDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDisplay(str) {
    if (!str) return '—';
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
}

function fmt12(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function updateDoctorLabel() {
    const docs = [...new Set(appointments.map(a => a.doctorName))].filter(Boolean);
    document.getElementById('patient-label').textContent = docs[0] || 'James Marry';
}

/* ── TOAST ──────────────────────────────────────── */
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2600);
}

/* ── INIT ───────────────────────────────────────── */
(function init() {
    // Seed demo data if storage is empty
    if (!appointments.length) {
        appointments = [
            {
                id: genId(), patientName: 'Henry James', doctorName: 'James Marry',
                hospital: 'Salus Center (General Hospital)', specialty: 'Dermatology',
                date: '2025-12-18', timeStart: '09:00', timeEnd: '09:15', reason: 'Routine checkup',
            },
            {
                id: genId(), patientName: 'Henry James', doctorName: 'James Marry',
                hospital: 'Ultracare (General Hospital)', specialty: 'Dermatology',
                date: '2025-12-18', timeStart: '10:00', timeEnd: '10:15', reason: 'Follow-up visit',
            },
        ];
        saveStorage();
    }

    buildCalendarHeader();
    renderCalendar();
    renderTable();
    updateDoctorLabel();
})();