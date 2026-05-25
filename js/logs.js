document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#logs-table tbody');
    
    const mockExams = [
        { name: 'Python Lab Test', lang: 'Python', students: '47/50', duration: '2h', date: '2026-05-19', status: 'Completed' },
        { name: 'C++ DSA Exam', lang: 'C++', students: '38/40', duration: '3h', date: '2026-05-18', status: 'Completed' },
        { name: 'Java OOP Test', lang: 'Java', students: '50/50', duration: '2h', date: '2026-05-17', status: 'Completed' },
        { name: 'Node.js API Exam', lang: 'Node.js', students: '22/25', duration: '1.5h', date: '2026-05-16', status: 'Completed' },
        { name: 'Python ML Lab', lang: 'Python', students: '35/35', duration: '2.5h', date: '2026-05-15', status: 'Completed' },
        { name: 'C++ Pointers', lang: 'C++', students: '40/40', duration: '2h', date: '2026-05-14', status: 'Failed' },
        { name: 'Java Spring', lang: 'Java', students: '30/30', duration: '3h', date: '2026-05-13', status: 'Completed' },
        { name: 'Python Basics', lang: 'Python', students: '45/50', duration: '1h', date: '2026-05-12', status: 'Completed' },
        { name: 'C Arrays', lang: 'C', students: '20/20', duration: '1.5h', date: '2026-05-11', status: 'Completed' },
        { name: 'Node.js Express', lang: 'Node.js', students: '15/15', duration: '2h', date: '2026-05-10', status: 'Completed' },
    ];

    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        mockExams.forEach(exam => {
            const tr = document.createElement('tr');
            
            let statusBadge = '';
            if (exam.status === 'Completed') statusBadge = '<span class="badge badge-green">Completed</span>';
            else if (exam.status === 'Active') statusBadge = '<span class="badge badge-cyan">Active</span>';
            else statusBadge = '<span class="badge badge-red">Failed</span>';

            tr.innerHTML = `
                <td class="font-semibold">${exam.name}</td>
                <td><span class="badge badge-ghost">${exam.lang}</span></td>
                <td>${exam.students}</td>
                <td>${exam.duration}</td>
                <td>${exam.date}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="flex gap-2">
                        <button class="btn btn-sm btn-ghost">View</button>
                        <button class="btn btn-sm btn-ghost">Download</button>
                        <button class="btn btn-sm btn-ghost text-red">Delete</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    renderTable();

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
