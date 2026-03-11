document.addEventListener('DOMContentLoaded', function() {
    const ktaForm = document.getElementById('kta-form');
    
    if (ktaForm) {
        ktaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(ktaForm);
            const submitBtn = ktaForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.querySelector('.btn-text').textContent;
            
            // Tampilkan loading
            submitBtn.disabled = true;
            submitBtn.querySelector('.btn-text').textContent = 'Mengirim...';
            
            fetch('includes/kta-submit.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('success', data.message);
                    ktaForm.reset();
                    
                    // Refresh halaman setelah 3 detik
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                } else {
                    showAlert('error', data.message);
                }
            })
            .catch(error => {
                showAlert('error', 'Terjadi kesalahan jaringan. Silakan coba lagi.');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.querySelector('.btn-text').textContent = originalBtnText;
            });
        });
    }
    
    // Fungsi untuk menampilkan alert
    function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.classList.add('fade-out');
            setTimeout(() => {
                alertDiv.remove();
            }, 500);
        }, 5000);
    }
});


// Autocomplete untuk provinsi dan kabupaten
$(document).ready(function() {
    const provinsiInput = $('#provinsi');
    const kabupatenInput = $('#kabupaten');
    const provinsiList = $('#provinsi-list');
    const kabupatenList = $('#kabupaten-list');
    
    // Cache untuk menyimpan data provinsi dan kabupaten
    let provinsiData = [];
    let kabupatenData = {};
    
    // Fungsi untuk memuat data provinsi dari API
    function loadProvinsiData() {
        if (provinsiData.length > 0) return;
        
        $.get('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json')
            .done(function(data) {
                provinsiData = data;
            })
            .fail(function() {
                console.error('Gagal memuat data provinsi');
                // Fallback data jika API tidak tersedia
                provinsiData = [
                    {id: '32', name: 'Jawa Barat'},
                    {id: '33', name: 'Jawa Tengah'},
                    {id: '35', name: 'Jawa Timur'},
                    {id: '31', name: 'DKI Jakarta'},
                    {id: '36', name: 'Banten'}
                ];
            });
    }
    
    // Fungsi untuk memuat data kabupaten berdasarkan provinsi
    function loadKabupatenData(provinsiId) {
        if (kabupatenData[provinsiId]) return;
        
        $.get(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${provinsiId}.json`)
            .done(function(data) {
                kabupatenData[provinsiId] = data;
            })
            .fail(function() {
                console.error('Gagal memuat data kabupaten');
                // Fallback data jika API tidak tersedia
                kabupatenData[provinsiId] = [
                    {id: '3273', name: 'Kota Bandung'},
                    {id: '3201', name: 'Kabupaten Bogor'},
                    {id: '3275', name: 'Kota Bekasi'},
                    {id: '3277', name: 'Kota Cimahi'},
                    {id: '3203', name: 'Kabupaten Cianjur'}
                ];
            });
    }
    
    // Event input untuk provinsi
    provinsiInput.on('input', function() {
        const input = $(this).val().toLowerCase();
        provinsiList.empty();
        
        if (input.length > 1) {
            const matches = provinsiData.filter(prov => 
                prov.name.toLowerCase().includes(input)
            );
            
            matches.forEach(match => {
                const item = $('<div>').text(match.name);
                item.on('click', function() {
                    provinsiInput.val(match.name);
                    provinsiList.empty();
                    loadKabupatenData(match.id);
                    kabupatenInput.val('').prop('disabled', false);
                });
                provinsiList.append(item);
            });
        }
    });
    
    // Event input untuk kabupaten
    kabupatenInput.on('input', function() {
        const input = $(this).val().toLowerCase();
        kabupatenList.empty();
        
        // Cari provinsi yang dipilih
        const selectedProvinsi = provinsiData.find(prov => 
            prov.name === provinsiInput.val()
        );
        
        if (input.length > 1 && selectedProvinsi && kabupatenData[selectedProvinsi.id]) {
            const matches = kabupatenData[selectedProvinsi.id].filter(kab => 
                kab.name.toLowerCase().includes(input)
            );
            
            matches.forEach(match => {
                const item = $('<div>').text(match.name);
                item.on('click', function() {
                    kabupatenInput.val(match.name);
                    kabupatenList.empty();
                });
                kabupatenList.append(item);
            });
        }
    });
    
    // Sembunyikan dropdown saat klik di luar
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#provinsi, #provinsi-list').length) {
            provinsiList.empty();
        }
        if (!$(e.target).closest('#kabupaten, #kabupaten-list').length) {
            kabupatenList.empty();
        }
    });
    
    // Nonaktifkan input kabupaten sampai provinsi dipilih
    kabupatenInput.prop('disabled', true);
    
    // Muat data provinsi saat halaman dimuat
    loadProvinsiData();
});


// validasi file upload

// Validasi file sebelum upload
function validateFile(input, allowedTypes, maxSizeMB) {
    if (input.files.length > 0) {
        const file = input.files[0];
        const fileType = file.name.split('.').pop().toLowerCase();
        const fileSizeMB = file.size / (1024 * 1024);
        
        if (!allowedTypes.includes(fileType)) {
            alert(`Jenis file tidak diizinkan. Hanya file ${allowedTypes.join(', ')} yang diterima.`);
            input.value = '';
            return false;
        }
        
        if (fileSizeMB > maxSizeMB) {
            alert(`Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB.`);
            input.value = '';
            return false;
        }
    }
    return true;
}

// Tambahkan event listener untuk validasi file
document.getElementById('logo-upload').addEventListener('change', function() {
    validateFile(this, ['jpg', 'jpeg', 'png', 'gif'], 5);
});

document.getElementById('ad-upload').addEventListener('change', function() {
    validateFile(this, ['pdf'], 5);
});

document.getElementById('art-upload').addEventListener('change', function() {
    validateFile(this, ['pdf', 'doc', 'docx'], 5);
});

document.getElementById('sk-upload').addEventListener('change', function() {
    validateFile(this, ['pdf', 'doc', 'docx'], 5);
});

document.getElementById('payment-upload').addEventListener('change', function() {
    validateFile(this, ['jpg', 'jpeg', 'png', 'gif', 'pdf'], 5);
});
