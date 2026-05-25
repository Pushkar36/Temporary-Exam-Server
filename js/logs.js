/**
 * ExamCloud — js/logs.js
 * Dynamic database sync for Exam History and Logs
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#logs-table tbody');
    
    // Load all stats and exams
    async function initLogsPage() {
        try {
            const [statsResp, examsResp, submissionsResp] = await Promise.all([
                fetch('/api/stats'),
                fetch('/api/exams'),
                fetch('/api/submissions')
            ]);

            const statsData = await statsResp.json();
            const examsData = await examsResp.json();
            const submissionsData = await submissionsResp.json();

            if (statsData.success && statsData.data) {
                const stats = statsData.data;
                const statCards = document.querySelectorAll('.stat-card');
                
                if (statCards.length === 4) {
                    // Card 0: Total Exams
                    statCards[0].querySelector('.stat-value').textContent = stats.totalExams;
                    
                    // Card 1: Total Students
                    statCards[1].querySelector('.stat-value').textContent = stats.totalStudents;
                    
                    // Card 2: Avg Score
                    statCards[2].querySelector('.stat-label').textContent = 'Avg Score';
                    statCards[2].querySelector('.stat-value').textContent = stats.avgScore + '%';
                    
                    // Card 3: Total Submissions
                    statCards[3].querySelector('.stat-label').textContent = 'Total Submissions';
                    statCards[3].querySelector('.stat-value').textContent = stats.totalSubmissions;
                }
            }

            if (examsData.success && examsData.data && submissionsData.success && submissionsData.data) {
                renderTable(examsData.data, submissionsData.data);
            }
        } catch (err) {
            console.error('Failed to load logs database stats:', err);
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--red);padding:30px;">⚠ Failed to load logs from server</td></tr>';
            }
        }
    }

    function renderTable(exams, submissions) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (exams.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px;">No exams recorded in history yet.</td></tr>';
            return;
        }

        exams.forEach(exam => {
            const examSubmissions = submissions.filter(s => s.exam_id === exam.id);
            const submissionsCount = examSubmissions.length;

            const tr = document.createElement('tr');
            
            let statusBadge = '';
            if (exam.status === 'completed') {
                statusBadge = '<span class="badge badge-green">Completed</span>';
            } else if (exam.status === 'active') {
                statusBadge = '<span class="badge badge-cyan">Active</span>';
            } else {
                statusBadge = '<span class="badge badge-red">Failed</span>';
            }

            const formattedDate = exam.created_at ? exam.created_at.split(' ')[0] : '—';
            const durationText = exam.duration_minutes >= 60 
                ? (exam.duration_minutes / 60).toFixed(1) + 'h' 
                : exam.duration_minutes + 'm';

            tr.innerHTML = `
                <td class="font-semibold">${exam.exam_name}</td>
                <td><span class="badge badge-ghost" style="text-transform:uppercase;">${exam.language}</span></td>
                <td>${submissionsCount}/${exam.max_students}</td>
                <td>${durationText}</td>
                <td>${formattedDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="flex gap-2">
                        <button class="btn btn-sm btn-ghost view-btn">View</button>
                        <button class="btn btn-sm btn-ghost download-btn">Download</button>
                        <button class="btn btn-sm btn-ghost text-red delete-btn">Delete</button>
                    </div>
                </td>
            `;

            // Attach event listeners dynamically to actions
            tr.querySelector('.view-btn').addEventListener('click', () => openViewModal(exam, submissionsCount));
            tr.querySelector('.download-btn').addEventListener('click', () => downloadExamReport(exam, examSubmissions));
            tr.querySelector('.delete-btn').addEventListener('click', () => deleteExam(exam.id, exam.exam_name));

            tableBody.appendChild(tr);
        });
    }

    /* ── VIEW EXAM DETAILS MODAL ────────────────────────────── */
    function openViewModal(exam, submissionsCount) {
        const modalId = `view-exam-modal-${exam.id}`;
        let existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay open';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';
        
        modal.innerHTML = `
            <div class="modal" style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:24px; max-width:600px; width:90%; box-shadow:0 10px 40px rgba(0,0,0,0.6); position:relative; animation:fadeInUp 0.3s ease both;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:18px;">
                    <h3 style="font-size:18px; font-weight:700; color:var(--text-primary); margin:0;">📝 Exam Details</h3>
                    <button style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px;" onclick="document.getElementById('${modalId}').remove()">✕</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:12px; font-size:13px; color:var(--text-secondary);">
                    <div><strong style="color:var(--text-primary);">Exam Name:</strong> ${exam.exam_name}</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div><strong style="color:var(--text-primary);">Language:</strong> <span class="badge badge-ghost" style="text-transform:uppercase;">${exam.language}</span></div>
                        <div><strong style="color:var(--text-primary);">Access Code:</strong> <span style="font-family:monospace; color:var(--cyan); font-weight:700; font-size:14px;">${exam.access_code}</span></div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div><strong style="color:var(--text-primary);">Duration:</strong> ${exam.duration_minutes} mins</div>
                        <div><strong style="color:var(--text-primary);">Difficulty:</strong> <span style="text-transform:capitalize;">${exam.difficulty}</span></div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div><strong style="color:var(--text-primary);">Max Students:</strong> ${exam.max_students}</div>
                        <div><strong style="color:var(--text-primary);">Total Submissions:</strong> ${submissionsCount}</div>
                    </div>
                    <div style="border-top:1px solid var(--border); padding-top:12px; margin-top:6px;">
                        <strong style="color:var(--text-primary); display:block; margin-bottom:6px;">Instructions:</strong>
                        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:6px; padding:10px; font-family:sans-serif; white-space:pre-wrap; max-height:120px; overflow-y:auto; color:var(--text-secondary); line-height:1.5;">${exam.instructions || 'No special instructions provided.'}</div>
                    </div>
                    <div style="margin-top:6px;">
                        <strong style="color:var(--text-primary); display:block; margin-bottom:6px;">Starter Code:</strong>
                        <pre style="background:#010409; border:1px solid var(--border); border-radius:6px; padding:10px; font-family:monospace; font-size:11px; white-space:pre-wrap; max-height:150px; overflow-y:auto; color:#c9d1d9; margin:0;">${exam.starter_code || 'No starter template.'}</pre>
                    </div>
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:20px; border-top:1px solid var(--border); padding-top:12px;">
                    <button class="btn btn-ghost btn-sm" onclick="document.getElementById('${modalId}').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /* ── DOWNLOAD EXAM REPORT JSON ─────────────────────────── */
    function downloadExamReport(exam, examSubmissions) {
        const report = {
            exam_id: exam.id,
            exam_name: exam.exam_name,
            language: exam.language,
            access_code: exam.access_code,
            difficulty: exam.difficulty,
            duration_minutes: exam.duration_minutes,
            max_students: exam.max_students,
            status: exam.status,
            created_at: exam.created_at,
            instructions: exam.instructions,
            starter_code: exam.starter_code,
            submissions: examSubmissions.map(s => ({
                student_id: s.student_id,
                score: s.score,
                test_cases_passed: s.test_cases_passed,
                test_cases_total: s.test_cases_total,
                submitted_at: s.submitted_at,
                code: s.code,
                output: s.output
            }))
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href",     dataStr);
        downloadAnchor.setAttribute("download", `exam-report-${exam.exam_name.replace(/\s+/g, '-').toLowerCase()}-${exam.id}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        // Show elegant success alert
        if (typeof showToast === 'function') {
            showToast('success', `Export bundle for "${exam.exam_name}" ready.`);
        } else {
            alert(`Report downloaded successfully!`);
        }
    }

    /* ── DELETE EXAM ────────────────────────────────────────── */
    async function deleteExam(id, name) {
        if (!confirm(`Are you sure you want to delete exam "${name}"?\nThis will remove it permanently from database records.`)) return;

        try {
            const resp = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
            const data = await resp.json();

            if (data.success) {
                // Show toast
                if (typeof showToast === 'function') {
                    showToast('error', `Exam "${name}" deleted.`);
                }
                initLogsPage();
            } else {
                alert(data.error || 'Failed to delete exam');
            }
        } catch (err) {
            alert('Server error: ' + err.message);
        }
    }

    function showToast(type, message, duration = 3500) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
        container.appendChild(toast);

        container.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:10px;';

        setTimeout(() => {
            toast.style.animation = 'slideInToast 0.3s ease reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    initLogsPage();

    // Basic search filtering
    const searchInput = document.getElementById('log-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const name = row.cells[0].textContent.toLowerCase();
                row.style.display = name.includes(query) ? '' : 'none';
            });
        });
    }
});
