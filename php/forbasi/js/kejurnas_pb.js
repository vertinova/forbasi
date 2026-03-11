/**
 * Kejurnas Management for PB Dashboard
 * Handles viewing, filtering, approval and rejection of Kejurnas registrations
 */

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

// Global variables
let allRegistrations = [];
let currentFilters = {
    status: 'all',
    category: 'all',
    level: 'all',
    pengda: 'all' // Changed to 'all' to show all pengda by default
};
let filtersInitialized = false; // Flag to prevent multiple initialization

// Initialize when section is shown
function initializeKejurnasSection() {
    loadSummary();
    loadStatistics(); // This will populate Pengda filter and trigger loadRegistrations
    
    // Setup filter change listeners with auto-apply (only once)
    if (!filtersInitialized) {
        setupFilterListeners();
        filtersInitialized = true;
    }
}

// Setup filter listeners
function setupFilterListeners() {
    const filterIds = ['kejurnas-filter-status', 'kejurnas-filter-category', 'kejurnas-filter-level', 'kejurnas-filter-pengda'];
    
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            // Remove existing listener if any
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Add new listener
            newElement.addEventListener('change', function() {
                const filterType = id.replace('kejurnas-filter-', '');
                currentFilters[filterType] = this.value;
                
                // Auto-apply filter
                applyFilters();
            });
        } else {
            console.warn(`Element with id '${id}' not found in DOM`);
        }
    });
}

// Load summary statistics - total participants
function loadSummary() {
    fetch('process_kejurnas_pb.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=get_summary'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displaySummary(data.data);
        } else {
            console.error('Failed to load summary:', data.message);
        }
    })
    .catch(error => {
        console.error('Error loading summary:', error);
    });
}

// Display summary statistics
function displaySummary(summary) {
    // Update category breakdown
    const totalRukibraEl = document.getElementById('total-rukibra');
    if (totalRukibraEl) {
        totalRukibraEl.textContent = (summary.total_rukibra || 0).toLocaleString('id-ID');
    }
    
    const totalBarisEl = document.getElementById('total-baris-berbaris');
    if (totalBarisEl) {
        totalBarisEl.textContent = (summary.total_baris_berbaris || 0).toLocaleString('id-ID');
    }
    
    const totalVarforEl = document.getElementById('total-varfor-musik');
    if (totalVarforEl) {
        totalVarforEl.textContent = (summary.total_varfor_musik || 0).toLocaleString('id-ID');
    }
    
    // Update level breakdown
    const totalSdEl = document.getElementById('total-sd');
    if (totalSdEl) {
        totalSdEl.textContent = (summary.total_sd || 0).toLocaleString('id-ID');
    }
    
    const totalSmpEl = document.getElementById('total-smp');
    if (totalSmpEl) {
        totalSmpEl.textContent = (summary.total_smp || 0).toLocaleString('id-ID');
    }
    
    const totalSmaEl = document.getElementById('total-sma');
    if (totalSmaEl) {
        totalSmaEl.textContent = (summary.total_sma || 0).toLocaleString('id-ID');
    }
    
    const totalPurnaEl = document.getElementById('total-purna');
    if (totalPurnaEl) {
        totalPurnaEl.textContent = (summary.total_purna || 0).toLocaleString('id-ID');
    }
}

// Load statistics
function loadStatistics() {
    const container = document.getElementById('kejurnas-stats-container');
    container.innerHTML = '<p class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Memuat statistik...</p>';
    
    fetch('process_kejurnas_pb.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=get_statistics'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        console.log('Statistics response:', text.substring(0, 200));
        try {
            const data = JSON.parse(text);
            if (data.success) {
                displayStatistics(data.data);
            } else {
                container.innerHTML = `<p class="text-center text-danger"><i class="fas fa-exclamation-triangle"></i> ${data.message}</p>`;
            }
        } catch (e) {
            console.error('JSON parse error:', e);
            console.error('Response text:', text);
            container.innerHTML = '<p class="text-center text-danger"><i class="fas fa-exclamation-triangle"></i> Server error - check console</p>';
        }
    })
    .catch(error => {
        console.error('Error loading statistics:', error);
        container.innerHTML = '<p class="text-center text-danger"><i class="fas fa-exclamation-triangle"></i> Gagal memuat statistik</p>';
    });
}

// Display statistics
function displayStatistics(stats) {
    const container = document.getElementById('kejurnas-stats-container');
    
    console.log('displayStatistics called with:', stats);
    
    if (!stats || stats.length === 0) {
        console.warn('No statistics data available');
        container.innerHTML = '<p class="text-center text-muted">Belum ada data statistik</p>';
        // Still populate Pengda filter even if no stats
        populatePengdaFilterFromUsers();
        return;
    }
    
    // Group statistics by Pengda for the filter
    let summaryHtml = '';
    const pengdaStats = {};
    stats.forEach(stat => {
        const pengdaId = stat.pengda_id;
        if (!pengdaStats[pengdaId]) {
            pengdaStats[pengdaId] = {
                pengda_name: stat.pengda_name,
                province_name: stat.province_name,
                is_jawa: stat.is_jawa,
                total_filled: 0,
                total_quota: 0,
                categories: {}
            };
        }
        
        const categoryKey = `${stat.category_name}_${stat.level}`;
        pengdaStats[pengdaId].categories[categoryKey] = {
            category_name: stat.category_name,
            level: stat.level,
            quota: stat.quota,
            filled: stat.filled,
            pending: stat.pending,
            approved: stat.approved,
            rejected: stat.rejected,
            available: stat.available
        };
        
        pengdaStats[pengdaId].total_filled += (stat.filled || 0);
        pengdaStats[pengdaId].total_quota += (stat.quota || 0);
    });
    
    // Store pengdaStats globally for filter use
    window.pengdaStatsData = pengdaStats;
    
    // Populate Pengda dropdown
    populatePengdaFilter(pengdaStats);
    
    container.innerHTML = summaryHtml;
}

// Populate Pengda filter from users table (alternative method)
function populatePengdaFilterFromUsers() {
    const pengdaSelect = document.getElementById('kejurnas-filter-pengda');
    if (!pengdaSelect) {
        console.error('Pengda select element not found');
        return;
    }
    
    console.log('Populating Pengda filter from users table...');
    
    // Show loading state
    pengdaSelect.innerHTML = '<option value="">Memuat Pengda...</option>';
    
    // Fetch Pengda list from server
    fetch('process_kejurnas_pb.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=get_pengda_list'
    })
    .then(response => response.json())
    .then(data => {
        console.log('Pengda list response:', data);
        
        if (data.success && data.data && data.data.length > 0) {
            pengdaSelect.innerHTML = '';
            
            // Add "Semua Pengda" option first
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = 'Semua Pengda';
            pengdaSelect.appendChild(allOption);
            
            // Add Pengda options
            data.data.forEach(pengda => {
                const option = document.createElement('option');
                option.value = pengda.id;
                option.textContent = pengda.province_name || pengda.username;
                pengdaSelect.appendChild(option);
            });
            
            // Set "Semua Pengda" as default
            pengdaSelect.value = 'all';
            currentFilters.pengda = 'all';
            
            // Setup event listener if not already initialized
            if (!filtersInitialized) {
                setupFilterListeners();
                filtersInitialized = true;
            }
            
            applyFilters();
        } else {
            pengdaSelect.innerHTML = '<option value="">Tidak ada Pengda</option>';
            console.error('No Pengda data available');
        }
    })
    .catch(error => {
        console.error('Error loading Pengda list:', error);
        pengdaSelect.innerHTML = '<option value="">Error memuat Pengda</option>';
    });
}

// Populate Pengda filter dropdown
function populatePengdaFilter(pengdaStats) {
    const pengdaSelect = document.getElementById('kejurnas-filter-pengda');
    if (!pengdaSelect) return;
    
    console.log('Populating Pengda filter with stats:', pengdaStats);
    
    // Clear existing options and add "Semua Pengda" option
    pengdaSelect.innerHTML = '';
    
    // Add "Semua Pengda" option as default
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Semua Pengda';
    pengdaSelect.appendChild(allOption);
    
    // Sort by province name
    const sortedPengdas = Object.entries(pengdaStats).sort((a, b) => {
        return a[1].province_name.localeCompare(b[1].province_name);
    });
    
    console.log('Sorted Pengdas:', sortedPengdas);
    
    if (sortedPengdas.length === 0) {
        console.warn('No Pengdas in stats, trying alternative method');
        populatePengdaFilterFromUsers();
        return;
    }
    
    // Add Pengda options
    sortedPengdas.forEach(([pengdaId, data]) => {
        const regionBadge = data.is_jawa ? 'Jawa' : 'Luar Jawa';
        const option = document.createElement('option');
        option.value = pengdaId;
        option.textContent = `${data.province_name} (${regionBadge})`;
        pengdaSelect.appendChild(option);
    });
    
    // Set "Semua Pengda" as default
    pengdaSelect.value = 'all';
    currentFilters.pengda = 'all';
    
    // Setup event listener if not already initialized
    if (!filtersInitialized) {
        setupFilterListeners();
        filtersInitialized = true;
    }
    
    // Load all registrations
    applyFilters();
}

// Show Pengda detail quota
function showPengdaDetail(pengdaId) {
    const detailContainer = document.getElementById('pengda-detail-container');
    if (!detailContainer) {
        // Create container if not exists
        const statsContainer = document.getElementById('kejurnas-stats-container');
        const newDiv = document.createElement('div');
        newDiv.id = 'pengda-detail-container';
        newDiv.style.marginTop = '20px';
        statsContainer.parentNode.insertBefore(newDiv, statsContainer.nextSibling);
    }
    
    const container = document.getElementById('pengda-detail-container');
    
    if (pengdaId === 'all' || !window.pengdaStatsData || !window.pengdaStatsData[pengdaId]) {
        container.innerHTML = '';
        return;
    }
    
    const pengda = window.pengdaStatsData[pengdaId];
    const regionColor = pengda.is_jawa ? '#28a745' : '#007bff';
    const regionIcon = pengda.is_jawa ? 'fa-map-marker-alt' : 'fa-globe-asia';
    const regionName = pengda.is_jawa ? 'Wilayah Jawa' : 'Wilayah Luar Jawa';
    
    let html = `
        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); overflow: hidden; border: 2px solid ${regionColor}; margin-bottom: 20px;">
            <div style="background: ${regionColor}; color: white; padding: 15px 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <h4 style="margin: 0; font-size: 1.2em; font-weight: 600;">
                        <i class="fas ${regionIcon}"></i> Detail Kuota: ${pengda.province_name}
                    </h4>
                    <span style="background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 0.85em; font-weight: 600;">
                        ${regionName}
                    </span>
                </div>
            </div>
            
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">
    `;
    
    Object.values(pengda.categories).forEach(cat => {
        const percent = cat.quota > 0 ? (cat.filled / cat.quota * 100).toFixed(0) : 0;
        const isFull = percent >= 100;
        const isNearFull = percent >= 75 && percent < 100;
        const progressColor = isFull ? '#dc3545' : (isNearFull ? '#ffc107' : regionColor);
        
        html += `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid ${progressColor};">
                <div style="margin-bottom: 12px;">
                    <strong style="color: #333; font-size: 0.95em; display: block;">${formatCategoryName(cat.category_name)}</strong>
                    <small style="color: #6c757d;">Tingkat ${cat.level}</small>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 0.85em; color: #666;">Terisi</span>
                        <strong style="font-size: 1.1em; color: ${progressColor};">${cat.filled} / ${cat.quota}</strong>
                    </div>
                    <div style="background: #e9ecef; height: 12px; border-radius: 6px; overflow: hidden; position: relative;">
                        <div style="width: ${Math.min(percent, 100)}%; height: 100%; background: ${progressColor}; transition: width 0.3s; border-radius: 6px;"></div>
                        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; font-size: 0.7em; font-weight: 600; color: ${percent > 50 ? 'white' : '#333'};">
                            ${percent}%
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: space-between; font-size: 0.8em;">
                    <div style="flex: 1; text-align: center; padding: 6px 4px; background: #fff3cd; border-radius: 4px; border: 1px solid #ffc107;">
                        <i class="fas fa-clock" style="color: #856404; font-size: 0.9em;"></i>
                        <div style="font-weight: 600; margin-top: 2px; color: #856404;">${cat.pending}</div>
                        <div style="font-size: 0.75em; color: #856404; margin-top: 1px;">Pending</div>
                    </div>
                    <div style="flex: 1; text-align: center; padding: 6px 4px; background: #d4edda; border-radius: 4px; border: 1px solid #28a745;">
                        <i class="fas fa-check" style="color: #155724; font-size: 0.9em;"></i>
                        <div style="font-weight: 600; margin-top: 2px; color: #155724;">${cat.approved}</div>
                        <div style="font-size: 0.75em; color: #155724; margin-top: 1px;">Approved</div>
                    </div>
                    <div style="flex: 1; text-align: center; padding: 6px 4px; background: #f8d7da; border-radius: 4px; border: 1px solid #dc3545;">
                        <i class="fas fa-times" style="color: #721c24; font-size: 0.9em;"></i>
                        <div style="font-weight: 600; margin-top: 2px; color: #721c24;">${cat.rejected}</div>
                        <div style="font-size: 0.75em; color: #721c24; margin-top: 1px;">Rejected</div>
                    </div>
                </div>
                
                ${cat.available < 0 ? `
                    <div style="margin-top: 8px; padding: 6px 10px; background: #f8d7da; border-radius: 4px; border-left: 3px solid #dc3545; font-size: 0.8em; color: #721c24;">
                        <i class="fas fa-exclamation-triangle"></i> <strong>Melebihi kuota ${Math.abs(cat.available)} club</strong>
                    </div>
                ` : cat.available <= 2 && cat.available > 0 ? `
                    <div style="margin-top: 8px; padding: 6px 10px; background: #fff3cd; border-radius: 4px; border-left: 3px solid #ffc107; font-size: 0.8em; color: #856404;">
                        <i class="fas fa-info-circle"></i> Tersisa ${cat.available} slot
                    </div>
                ` : cat.available > 2 ? `
                    <div style="margin-top: 8px; padding: 6px 10px; background: #d4edda; border-radius: 4px; border-left: 3px solid #28a745; font-size: 0.8em; color: #155724;">
                        <i class="fas fa-check-circle"></i> Tersisa ${cat.available} slot
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Load registrations
function loadRegistrations() {
    const container = document.getElementById('kejurnas-registrations-container');
    container.innerHTML = '<p class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Memuat data registrasi...</p>';
    
    // Reset to page 1 when filters change
    currentPage = 1;
    
    const formData = new FormData();
    formData.append('action', 'get_all_registrations');
    formData.append('filter_status', currentFilters.status);
    formData.append('filter_category', currentFilters.category);
    formData.append('filter_level', currentFilters.level);
    formData.append('filter_pengda', currentFilters.pengda);
    
    fetch('process_kejurnas_pb.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        console.log('Registrations response:', text.substring(0, 200));
        try {
            const data = JSON.parse(text);
            if (data.success) {
                allRegistrations = data.data;
                displayRegistrations(allRegistrations);
            } else {
                container.innerHTML = `<p class="text-center text-danger"><i class="fas fa-exclamation-triangle"></i> ${data.message}</p>`;
            }
        } catch (e) {
            console.error('JSON parse error:', e);
            console.error('Response text:', text);
            container.innerHTML = '<p class="text-center text-danger"><i class="fas fa-exclamation-triangle"></i> Server error - check console</p>';
        }
    })
    .catch(error => {
        console.error('Error loading registrations:', error);
        container.innerHTML = '<p class="text-center text-danger"><i class="fas fa-exclamation-triangle"></i> Gagal memuat data registrasi</p>';
    });
}

// Display registrations in table
// Pagination state
let currentPage = 1;
const itemsPerPage = 5;

function displayRegistrations(registrations) {
    const container = document.getElementById('kejurnas-registrations-container');
    
    if (!registrations || registrations.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Tidak ada data registrasi</p>';
        return;
    }
    
    // Store all registrations for pagination
    allRegistrations = registrations;
    
    // Calculate pagination
    const totalPages = Math.ceil(allRegistrations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = allRegistrations.slice(startIndex, endIndex);
    
    let html = `
        <div style="overflow-x: auto;">
            <table class="styled-table">
                <thead>
                    <tr>
                        <th>Logo</th>
                        <th>Nama Club</th>
                        <th>Kategori</th>
                        <th>Level</th>
                        <th>Provinsi</th>
                        <th>Wilayah</th>
                        <th>Total Anggota</th>
                        <th>Pengda</th>
                        <th>Status</th>
                        <th>Tgl Daftar</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    paginatedData.forEach(reg => {
        const statusBadge = getStatusBadge(reg.approval_status);
        const regionBadge = reg.is_jawa == 1 
            ? '<span class="badge" style="background: #28a745;"><i class="fas fa-map-marker-alt"></i> Jawa</span>'
            : '<span class="badge" style="background: #007bff;"><i class="fas fa-globe"></i> Luar Jawa</span>';
        const logoUrl = reg.logo_path ? `uploads/${reg.logo_path}` : '../assets/LOGO-FORBASI.png';
        
        html += `
            <tr>
                <td><img src="${logoUrl}" alt="Logo" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px;"></td>
                <td><strong>${reg.club_name}</strong></td>
                <td>${formatCategoryName(reg.category_name)}</td>
                <td>${reg.level}</td>
                <td>${reg.province_name}</td>
                <td>${regionBadge}</td>
                <td>${reg.total_members}</td>
                <td>
                    <div style="font-size: 0.9em;">
                        <div><i class="fas fa-user"></i> ${reg.pengda_username}</div>
                        <div style="color: #666;"><i class="fas fa-envelope"></i> ${reg.pengda_email}</div>
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td>${formatDate(reg.registered_at)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewRegistrationDetails(${reg.id})" title="Lihat Detail">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${reg.approval_status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="approveRegistration(${reg.id})" title="Setujui">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="rejectRegistration(${reg.id})" title="Tolak">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    // Add pagination controls if needed
    if (totalPages > 1) {
        html += `
            <div style="display: flex; justify-content: center; align-items: center; margin-top: 20px; gap: 10px;">
                <button onclick="changePage(${currentPage - 1})" 
                        ${currentPage === 1 ? 'disabled' : ''} 
                        style="padding: 8px 15px; border: 1px solid #ddd; background: ${currentPage === 1 ? '#f5f5f5' : 'white'}; border-radius: 4px; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                
                <div style="display: flex; gap: 5px;">
        `;
        
        // Generate page numbers
        for (let i = 1; i <= totalPages; i++) {
            // Show first, last, current, and adjacent pages
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `
                    <button onclick="changePage(${i})" 
                            style="padding: 8px 12px; border: 1px solid ${i === currentPage ? '#0d9500' : '#ddd'}; background: ${i === currentPage ? 'linear-gradient(135deg, #0d9500 0%, #0a7300 100%)' : 'white'}; color: ${i === currentPage ? 'white' : '#333'}; border-radius: 4px; cursor: pointer; font-weight: ${i === currentPage ? 'bold' : 'normal'};">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += '<span style="padding: 8px 5px;">...</span>';
            }
        }
        
        html += `
                </div>
                
                <button onclick="changePage(${currentPage + 1})" 
                        ${currentPage === totalPages ? 'disabled' : ''} 
                        style="padding: 8px 15px; border: 1px solid #ddd; background: ${currentPage === totalPages ? '#f5f5f5' : 'white'}; border-radius: 4px; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <div style="text-align: center; margin-top: 10px; color: #666; font-size: 0.9em;">
                Menampilkan ${startIndex + 1}-${Math.min(endIndex, allRegistrations.length)} dari ${allRegistrations.length} data
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Change page function
function changePage(page) {
    const totalPages = Math.ceil(allRegistrations.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayRegistrations(allRegistrations);
}

// Apply filters
function applyFilters() {
    loadRegistrations();
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge badge-warning"><i class="fas fa-clock"></i> Menunggu</span>',
        'approved': '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Disetujui</span>',
        'rejected': '<span class="badge badge-danger"><i class="fas fa-times-circle"></i> Ditolak</span>'
    };
    return badges[status] || status;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// View registration details
function viewRegistrationDetails(registrationId) {
    const reg = allRegistrations.find(r => r.id == registrationId);
    if (!reg) return;
    
    const regionText = reg.is_jawa == 1 ? '🏝️ Jawa' : '🌏 Luar Jawa';
    const statusText = getStatusBadge(reg.approval_status);
    const logoUrl = reg.logo_path ? `uploads/${reg.logo_path}` : '../assets/LOGO-FORBASI.png';
    
    let detailsHtml = `
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 15px; max-height: 500px; overflow-y: auto;">
            <div style="text-align: center;">
                <img src="${logoUrl}" alt="Logo" style="width: 120px; height: 120px; object-fit: contain; border: 2px solid #ddd; border-radius: 8px; padding: 10px;">
            </div>
            <div>
                <h3 style="margin: 0 0 15px 0;">${reg.club_name}</h3>
                <div style="display: grid; gap: 10px;">
                    <div><strong>Kategori:</strong> ${formatCategoryName(reg.category_name)}</div>
                    <div><strong>Level:</strong> ${reg.level}</div>
                    <div><strong>Provinsi:</strong> ${reg.province_name} ${regionText}</div>
                    <div><strong>Total Anggota:</strong> ${reg.total_members} orang</div>
                    <div><strong>Status:</strong> ${statusText}</div>
                </div>
            </div>
        </div>
        
        <hr>
        
        <h4><i class="fas fa-users"></i> Informasi Tim</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
                <strong><i class="fas fa-chalkboard-teacher"></i> Pelatih</strong>
                <div>${reg.coach_name}</div>
                <div style="color: #666;"><i class="fas fa-phone"></i> ${reg.coach_phone}</div>
            </div>
            <div>
                <strong><i class="fas fa-user-tie"></i> Manager</strong>
                <div>${reg.manager_name}</div>
                <div style="color: #666;"><i class="fas fa-phone"></i> ${reg.manager_phone}</div>
            </div>
        </div>
        
        <hr>
        
        <h4><i class="fas fa-building"></i> Informasi Pengda</h4>
        <div>
            <div><strong>Username:</strong> ${reg.pengda_username}</div>
            <div><strong>Email:</strong> ${reg.pengda_email}</div>
            <div><strong>Telepon:</strong> ${reg.pengda_phone}</div>
        </div>
        
        ${reg.notes ? `
            <hr>
            <h4><i class="fas fa-comment"></i> Catatan</h4>
            <p>${reg.notes}</p>
        ` : ''}
        
        ${reg.approval_notes ? `
            <hr>
            <h4><i class="fas fa-clipboard"></i> Catatan Approval</h4>
            <p>${reg.approval_notes}</p>
            <p style="color: #666; font-size: 0.9em;">Oleh: ${reg.approved_by_username || 'N/A'} pada ${formatDate(reg.approval_date)}</p>
        ` : ''}
    `;
    
    Swal.fire({
        title: 'Detail Registrasi',
        html: detailsHtml,
        icon: 'info',
        width: '800px',
        confirmButtonText: 'Tutup'
    });
}

// Approve registration
function approveRegistration(registrationId) {
    Swal.fire({
        title: 'Setujui Registrasi?',
        text: 'Apakah Anda yakin ingin menyetujui registrasi ini?',
        icon: 'question',
        input: 'textarea',
        inputLabel: 'Catatan (opsional)',
        inputPlaceholder: 'Masukkan catatan untuk approval...',
        showCancelButton: true,
        confirmButtonText: 'Ya, Setujui',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#28a745',
        showLoaderOnConfirm: true,
        preConfirm: (notes) => {
            const formData = new FormData();
            formData.append('action', 'approve');
            formData.append('registration_id', registrationId);
            formData.append('approval_notes', notes || '');
            
            return fetch('process_kejurnas_pb.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    throw new Error(data.message);
                }
                return data;
            })
            .catch(error => {
                Swal.showValidationMessage(`Request failed: ${error}`);
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Registrasi berhasil disetujui',
                timer: 2000,
                showConfirmButton: false
            });
            loadSummary();
            loadStatistics();
            loadRegistrations();
        }
    });
}

// Reject registration
function rejectRegistration(registrationId) {
    Swal.fire({
        title: 'Tolak Registrasi?',
        text: 'Alasan penolakan wajib diisi',
        icon: 'warning',
        input: 'textarea',
        inputLabel: 'Alasan Penolakan',
        inputPlaceholder: 'Masukkan alasan penolakan...',
        inputValidator: (value) => {
            if (!value || value.trim() === '') {
                return 'Alasan penolakan harus diisi!';
            }
        },
        showCancelButton: true,
        confirmButtonText: 'Ya, Tolak',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#dc3545',
        showLoaderOnConfirm: true,
        preConfirm: (notes) => {
            const formData = new FormData();
            formData.append('action', 'reject');
            formData.append('registration_id', registrationId);
            formData.append('approval_notes', notes);
            
            return fetch('process_kejurnas_pb.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    throw new Error(data.message);
                }
                return data;
            })
            .catch(error => {
                Swal.showValidationMessage(`Request failed: ${error}`);
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Registrasi berhasil ditolak',
                timer: 2000,
                showConfirmButton: false
            });
            loadSummary();
            loadStatistics();
            loadRegistrations();
        }
    });
}

// Export to global scope
window.initializeKejurnasSection = initializeKejurnasSection;
window.viewRegistrationDetails = viewRegistrationDetails;
window.approveRegistration = approveRegistration;
window.rejectRegistration = rejectRegistration;
window.exportToExcel = exportToExcel;

// Export to Excel function
function exportToExcel() {
    // Show loading message
    Swal.fire({
        title: 'Memproses...',
        text: 'Sedang membuat file Excel...',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading();
        }
    });
    
    const formData = new FormData();
    formData.append('action', 'export_to_excel');
    formData.append('filter_status', currentFilters.status);
    formData.append('filter_category', currentFilters.category);
    formData.append('filter_level', currentFilters.level);
    formData.append('filter_pengda', currentFilters.pengda || 'all');
    
    fetch('process_kejurnas_pb.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.blob();
    })
    .then(blob => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename with current date
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        a.download = `Peserta_Kompetisi_${dateStr}.xlsx`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'File Excel berhasil diunduh',
            timer: 2000,
            showConfirmButton: false
        });
    })
    .catch(error => {
        console.error('Error exporting to Excel:', error);
        Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: 'Gagal mengekspor data ke Excel. Silakan coba lagi.',
            confirmButtonText: 'OK'
        });
    });
}
