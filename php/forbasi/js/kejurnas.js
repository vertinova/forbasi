// kejurnas.js - JavaScript for Kejurnas functionality

// Category and level mapping
const categoryLevels = {
    'rukibra': ['SMP', 'SMA'],
    'varfor_musik': ['SMP', 'SMA'],
    'baris_berbaris': ['SD', 'SMP', 'SMA', 'Purna']
};

// Category display names
const categoryDisplayNames = {
    'rukibra': 'Rukibra',
    'varfor_musik': 'Varfor Musik',
    'baris_berbaris': 'Baris Berbaris'
};

// Helper function to format category name
function formatCategoryName(categoryName) {
    return categoryDisplayNames[categoryName] || categoryName.replace(/_/g, ' ').toUpperCase();
}

// Global variable to store selected club data
let selectedClubData = null;
let searchTimeout = null;

// Initialize Kejurnas functionality
function initKejurnas() {
    const categorySelect = document.getElementById('kejurnas-category');
    const levelSelect = document.getElementById('kejurnas-level');
    const kejurnasForm = document.getElementById('kejurnas-form');
    const clubSearchInput = document.getElementById('kejurnas-club-search');
    const clubSearchResults = document.getElementById('club-search-results');
    const clearClubBtn = document.getElementById('clear-club-selection');
    
    if (!categorySelect || !levelSelect || !kejurnasForm) {
        console.log('Kejurnas elements not found, skipping initialization');
        return;
    }
    
    // Update level options when category changes
    categorySelect.addEventListener('change', function() {
        const category = this.value;
        
        levelSelect.innerHTML = '<option value="">-- Pilih Tingkat --</option>';
        
        if (category && categoryLevels[category]) {
            categoryLevels[category].forEach(level => {
                const option = document.createElement('option');
                option.value = level;
                option.textContent = level;
                levelSelect.appendChild(option);
            });
            levelSelect.disabled = false;
        } else {
            levelSelect.disabled = true;
        }
        
        // Load quota info when both category and level are selected
        loadQuotaInfo();
    });
    
    // Load quota info when level changes
    levelSelect.addEventListener('change', function() {
        loadQuotaInfo();
    });
    
    // Club search autocomplete
    if (clubSearchInput) {
        clubSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim();
            
            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            if (searchTerm.length < 2) {
                clubSearchResults.style.display = 'none';
                return;
            }
            
            // Debounce search
            searchTimeout = setTimeout(() => {
                searchClubs(searchTerm);
            }, 300);
        });
        
        // Hide results when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== clubSearchInput && e.target !== clubSearchResults) {
                clubSearchResults.style.display = 'none';
            }
        });
    }
    
    // Clear club selection
    if (clearClubBtn) {
        clearClubBtn.addEventListener('click', function() {
            clearClubSelection();
        });
    }
    
    // Form submission
    kejurnasForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!selectedClubData) {
            Swal.fire('Error!', 'Silakan pilih club terlebih dahulu', 'error');
            return;
        }
        
        const formData = new FormData(this);
        formData.append('action', 'register');
        
        Swal.fire({
            title: 'Mendaftar...',
            text: 'Harap tunggu...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        fetch('process_kejurnas.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            // Check if response is ok
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // Clone response to read it twice if needed
            return response.clone().text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Invalid JSON response:', text);
                    throw new Error('Server returned invalid JSON. Check console for details.');
                }
            });
        })
        .then(data => {
            Swal.close();
            if (data.success) {
                Swal.fire('Berhasil!', data.message, 'success');
                kejurnasForm.reset();
                levelSelect.disabled = true;
                document.getElementById('kejurnas-quota-info').style.display = 'none';
                clearClubSelection();
                loadKejurnasRegistrations();
            } else {
                Swal.fire('Gagal!', data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.close();
            Swal.fire('Error!', error.message || 'Terjadi kesalahan saat mendaftar', 'error');
        });
    });
    
    // Form reset
    kejurnasForm.addEventListener('reset', function() {
        clearClubSelection();
    });
}

// Search clubs function
function searchClubs(searchTerm) {
    const clubSearchResults = document.getElementById('club-search-results');
    
    fetch('process_kejurnas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=search_clubs&search=${encodeURIComponent(searchTerm)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data.length > 0) {
            let html = '<div style="padding: 5px;">';
            
            data.data.forEach(club => {
                const logoPath = club.logo_path ? `uploads/${club.logo_path}` : '../assets/LOGO-FORBASI.png';
                html += `
                    <div class="club-search-item" onclick="selectClub(${club.kta_id})" style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; display: flex; align-items: center; gap: 10px;">
                        <img src="${logoPath}" alt="Logo" style="width: 40px; height: 40px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #333;">${club.club_name}</div>
                            <div style="font-size: 0.85em; color: #666;">Pelatih: ${club.coach_name || 'N/A'} | Anggota: ${club.total_members || 0}</div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            clubSearchResults.innerHTML = html;
            clubSearchResults.style.display = 'block';
        } else {
            clubSearchResults.innerHTML = '<div style="padding: 15px; text-align: center; color: #999;">Tidak ada club ditemukan</div>';
            clubSearchResults.style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Error searching clubs:', error);
        clubSearchResults.style.display = 'none';
    });
}

// Select club function
function selectClub(ktaId) {
    fetch('process_kejurnas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=get_club_details&kta_id=${ktaId}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            selectedClubData = data.data;
            displaySelectedClub(data.data);
            document.getElementById('club-search-results').style.display = 'none';
        } else {
            Swal.fire('Error!', data.message || 'Gagal mengambil data club', 'error');
        }
    })
    .catch(error => {
        console.error('Error getting club details:', error);
        Swal.fire('Error!', 'Terjadi kesalahan saat mengambil data club', 'error');
    });
}

// Display selected club
function displaySelectedClub(clubData) {
    const logoPath = clubData.logo_path ? `uploads/${clubData.logo_path}` : '../assets/LOGO-FORBASI.png';
    
    // Set hidden input
    document.getElementById('selected-kta-id').value = clubData.kta_id;
    
    // Hide search input
    document.getElementById('kejurnas-club-search').value = clubData.club_name;
    document.getElementById('kejurnas-club-search').disabled = true;
    
    // Display club info
    document.getElementById('selected-club-logo').src = logoPath;
    document.getElementById('selected-club-name').textContent = clubData.club_name;
    document.getElementById('selected-club-address').textContent = clubData.club_address || 'N/A';
    document.getElementById('selected-club-coach').textContent = clubData.coach_name || 'N/A';
    document.getElementById('selected-club-manager').textContent = clubData.manager_name || 'N/A';
    document.getElementById('selected-club-members').textContent = clubData.total_members || '0';
    document.getElementById('selected-club-phone').textContent = clubData.coach_phone || 'N/A';
    
    // Show club info section
    document.getElementById('selected-club-info').style.display = 'block';
}

// Clear club selection
function clearClubSelection() {
    selectedClubData = null;
    document.getElementById('selected-kta-id').value = '';
    document.getElementById('kejurnas-club-search').value = '';
    document.getElementById('kejurnas-club-search').disabled = false;
    document.getElementById('selected-club-info').style.display = 'none';
    document.getElementById('club-search-results').style.display = 'none';
}

// Function to load quota information
function loadQuotaInfo() {
    const category = document.getElementById('kejurnas-category').value;
    const level = document.getElementById('kejurnas-level').value;
    const eventId = document.getElementById('kejurnas-event-id').value;
    
    if (!category || !level) {
        document.getElementById('kejurnas-quota-info').style.display = 'none';
        return;
    }
    
    fetch('process_kejurnas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=get_available_slots&event_id=${eventId}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const slot = data.data.find(s => s.category_name === category && s.level === level);
            if (slot) {
                const quotaInfo = document.getElementById('kejurnas-quota-info');
                const region = slot.is_user_jawa ? 'Jawa' : 'Luar Jawa';
                const available = slot.available_for_user;
                const total = slot.is_user_jawa ? slot.quota_jawa : slot.quota_luar_jawa;
                const filled = slot.is_user_jawa ? slot.filled_jawa : slot.filled_luar_jawa;
                
                let messageClass = 'alert-info';
                let icon = 'fa-info-circle';
                
                if (available === 0) {
                    messageClass = 'alert-danger';
                    icon = 'fa-exclamation-triangle';
                } else if (available <= 2) {
                    messageClass = 'alert-warning';
                    icon = 'fa-exclamation-circle';
                }
                
                quotaInfo.className = `alert ${messageClass}`;
                quotaInfo.querySelector('i').className = `fas ${icon}`;
                document.getElementById('quota-message').textContent = 
                    `Wilayah ${region} - Tersedia: ${available} dari ${total} (Terisi: ${filled})`;
                quotaInfo.style.display = 'block';
            }
        }
    })
    .catch(error => console.error('Error loading quota:', error));
}

// Function to load quota table
function loadQuotaTable() {
    const eventId = document.getElementById('kejurnas-event-id').value;
    const container = document.getElementById('quota-table-container');
    
    if (!container) return;
    
    fetch('process_kejurnas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=get_available_slots&event_id=${eventId}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            let html = '<div class="table-responsive"><table class="data-table">';
            html += '<thead><tr><th>Kategori</th><th>Tingkat</th><th>Kuota Jawa</th><th>Terisi Jawa</th><th>Kuota Luar Jawa</th><th>Terisi Luar Jawa</th></tr></thead>';
            html += '<tbody>';
            
            data.data.forEach(slot => {
                html += '<tr>';
                html += `<td data-label="Kategori">${formatCategoryName(slot.category_name)}</td>`;
                html += `<td data-label="Tingkat">${slot.level}</td>`;
                html += `<td data-label="Kuota Jawa">${slot.quota_jawa}</td>`;
                html += `<td data-label="Terisi Jawa"><span class="status-badge ${slot.filled_jawa >= slot.quota_jawa ? 'status-rejected' : 'status-approved'}">${slot.filled_jawa}</span></td>`;
                html += `<td data-label="Kuota Luar Jawa">${slot.quota_luar_jawa}</td>`;
                html += `<td data-label="Terisi Luar Jawa"><span class="status-badge ${slot.filled_luar_jawa >= slot.quota_luar_jawa ? 'status-rejected' : 'status-approved'}">${slot.filled_luar_jawa}</span></td>`;
                html += '</tr>';
            });
            
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p class="text-center text-muted">Gagal memuat data kuota</p>';
        }
    })
    .catch(error => {
        console.error('Error loading quota table:', error);
        container.innerHTML = '<p class="text-center text-danger">Terjadi kesalahan saat memuat data</p>';
    });
}

// Function to load registrations
function loadKejurnasRegistrations() {
    const container = document.getElementById('kejurnas-registrations-container');
    
    if (!container) return;
    
    fetch('process_kejurnas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=get_registrations'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.data.length === 0) {
                container.innerHTML = '<p class="text-center text-muted">Belum ada pendaftaran</p>';
                return;
            }
            
            let html = '<div class="table-responsive"><table class="data-table">';
            html += '<thead><tr><th>Logo</th><th>Club</th><th>Kategori</th><th>Tingkat</th><th>Pelatih</th><th>Manager</th><th>Anggota</th><th>Status</th><th>Tanggal Daftar</th><th>Aksi</th></tr></thead>';
            html += '<tbody>';
            
            data.data.forEach(reg => {
                // Status approval dari PB
                let statusBadge = '';
                let statusInfo = '';
                
                if (reg.approval_status === 'approved') {
                    statusBadge = '<span class="status-badge status-approved"><i class="fas fa-check-circle"></i> Disetujui PB</span>';
                    if (reg.approval_date) {
                        statusInfo = `<small style="display: block; color: #28a745; margin-top: 4px;">Pada: ${new Date(reg.approval_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</small>`;
                    }
                } else if (reg.approval_status === 'rejected') {
                    statusBadge = '<span class="status-badge status-rejected"><i class="fas fa-times-circle"></i> Ditolak PB</span>';
                    if (reg.approval_notes) {
                        statusInfo = `<small style="display: block; color: #dc3545; margin-top: 4px;" title="${reg.approval_notes}">Alasan: ${reg.approval_notes.substring(0, 30)}${reg.approval_notes.length > 30 ? '...' : ''}</small>`;
                    }
                } else {
                    statusBadge = '<span class="status-badge status-pending"><i class="fas fa-clock"></i> Menunggu Persetujuan PB</span>';
                }
                
                const logoPath = reg.logo_path ? `uploads/${reg.logo_path}` : '../assets/LOGO-FORBASI.png';
                
                html += '<tr>';
                html += `<td data-label="Logo"><img src="${logoPath}" alt="Logo" style="width: 50px; height: 50px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px; padding: 2px;"></td>`;
                html += `<td data-label="Club"><strong>${reg.club_name}</strong></td>`;
                html += `<td data-label="Kategori">${formatCategoryName(reg.category_name)}</td>`;
                html += `<td data-label="Tingkat"><span class="badge" style="background: #17a2b8; color: white; padding: 4px 8px; border-radius: 4px;">${reg.level}</span></td>`;
                html += `<td data-label="Pelatih">${reg.coach_name || '-'}</td>`;
                html += `<td data-label="Manager">${reg.manager_name || '-'}</td>`;
                html += `<td data-label="Anggota"><strong>${reg.total_members || '-'}</strong></td>`;
                html += `<td data-label="Status">${statusBadge}${statusInfo}</td>`;
                html += `<td data-label="Tanggal">${new Date(reg.registered_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>`;
                html += '<td data-label="Aksi">';
                
                if (reg.approval_status === 'pending') {
                    html += `<button class="btn btn-danger btn-sm" onclick="deleteKejurnasRegistration(${reg.id})" title="Hapus pendaftaran"><i class="fas fa-trash"></i> Hapus</button>`;
                } else if (reg.approval_status === 'approved') {
                    html += `<button class="btn btn-success btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;"><i class="fas fa-check"></i> Disetujui</button>`;
                } else if (reg.approval_status === 'rejected') {
                    // Jika ditolak, bisa dihapus untuk input ulang
                    html += `<button class="btn btn-warning btn-sm" onclick="deleteKejurnasRegistration(${reg.id})" title="Hapus untuk mendaftar ulang" style="margin-right: 5px;"><i class="fas fa-trash-restore"></i> Hapus & Daftar Ulang</button>`;
                    if (reg.approval_notes) {
                        html += `<button class="btn btn-info btn-sm" onclick="showRejectionReason('${reg.approval_notes.replace(/'/g, "\\'")}', '${reg.approved_by_username || 'PB'}')" title="Lihat alasan penolakan"><i class="fas fa-info-circle"></i> Alasan</button>`;
                    }
                }
                
                html += '</td></tr>';
            });
            
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p class="text-center text-danger">Gagal memuat data pendaftaran</p>';
        }
    })
    .catch(error => {
        console.error('Error loading registrations:', error);
        container.innerHTML = '<p class="text-center text-danger">Terjadi kesalahan saat memuat data</p>';
    });
}

// Delete registration function
function deleteKejurnasRegistration(id) {
    Swal.fire({
        title: 'Hapus Pendaftaran?',
        text: 'Pendaftaran yang sudah dihapus tidak dapat dikembalikan!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('process_kejurnas.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=delete&registration_id=${id}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire('Berhasil!', data.message, 'success');
                    loadKejurnasRegistrations();
                } else {
                    Swal.fire('Gagal!', data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire('Error!', 'Terjadi kesalahan saat menghapus pendaftaran', 'error');
            });
        }
    });
}

// Fungsi untuk menampilkan alasan penolakan secara detail
function showRejectionReason(reason, approver) {
    Swal.fire({
        title: '<i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i> Pendaftaran Ditolak',
        html: `
            <div style="text-align: left; padding: 10px;">
                <p style="margin-bottom: 15px; color: #6c757d;">
                    <strong>Ditolak oleh:</strong> ${approver}
                </p>
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                    <p style="margin: 0; font-weight: 600; color: #856404; margin-bottom: 8px;">
                        <i class="fas fa-info-circle"></i> Alasan Penolakan:
                    </p>
                    <p style="margin: 0; color: #856404; line-height: 1.6;">
                        ${reason}
                    </p>
                </div>
                <p style="margin-top: 15px; color: #6c757d; font-size: 0.9em;">
                    <i class="fas fa-lightbulb"></i> Silakan perbaiki sesuai catatan di atas, kemudian hapus pendaftaran ini dan daftar ulang.
                </p>
            </div>
        `,
        icon: 'warning',
        confirmButtonText: '<i class="fas fa-check"></i> Mengerti',
        confirmButtonColor: '#ffc107',
        width: '600px'
    });
}

// Load Kejurnas data when section is shown
function loadKejurnasSection() {
    loadKejurnasRegistrations();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initKejurnas();
});
