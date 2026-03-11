// ganti password
function validatePassword() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword.length < 8) {
        // Using the global displayAlert function
        displayAlert('danger', 'Password baru harus minimal 8 karakter!');
        return false;
    }
    
    if (newPassword !== confirmPassword) {
        // Using the global displayAlert function
        displayAlert('danger', 'Password baru dan konfirmasi password tidak cocok!');
        return false;
    }
    
    return true;
}

// Logika pengalihan tab
function showTab(tabId) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.style.display = 'block';
            content.classList.add('active');
            content.classList.add('animate__fadeIn');
        } else {
            content.style.display = 'none';
            content.classList.remove('active');
            content.classList.remove('animate__fadeIn');
        }
    });

    const menuItems = document.querySelectorAll('.nav-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabId) {
            item.classList.add('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Fungsi untuk menangani input file
function setupFileInput(inputId, displayId) {
    const fileInput = document.getElementById(inputId);
    const fileNameDisplay = document.getElementById(displayId);

    if (fileInput && fileNameDisplay) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                fileNameDisplay.textContent = this.files[0].name;

                if (this.files[0].size > 2 * 1024 * 1024) {
                    displayAlert('danger', 'File terlalu besar (maksimal 2MB)');
                    this.value = '';
                    fileNameDisplay.textContent = 'Ukuran file melebihi batas!';
                    fileNameDisplay.style.color = 'var(--danger)'; // Assuming a CSS variable for danger color
                } else {
                    fileNameDisplay.style.color = 'var(--success)';
                }
            } else {
                fileNameDisplay.textContent = '';
                fileNameDisplay.style.color = ''; // Reset color
            }
        });
    } else {
        console.warn(`Elemen dengan ID ${inputId} atau ${displayId} tidak ditemukan.`);
    }
}

// Event listeners untuk dropdown provinsi/kota
const profileProvinceSelect = document.getElementById('profile-province');
const profileCitySelect = document.getElementById('profile-city');
const ktaProvinceSelect = document.getElementById('kta-province');
const ktaCitySelect = document.getElementById('kta-city');

function loadCities(provinceId, citySelectElement, selectedCityId = null) {
    citySelectElement.innerHTML = '<option value="">Memuat Kabupaten/Kota...</option>';
    citySelectElement.disabled = true;

    if (provinceId) {
        fetch(`users.php?get_cities_by_province_id=${provinceId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                citySelectElement.innerHTML = '<option value="">Pilih Kabupaten/Kota</option>';
                if (data.length > 0) {
                    data.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city.id;
                        option.textContent = city.name;
                        if (selectedCityId && city.id == selectedCityId) {
                            option.selected = true;
                        }
                        citySelectElement.appendChild(option);
                    });
                    citySelectElement.disabled = false;
                } else {
                    citySelectElement.innerHTML = '<option value="">Tidak ada Kabupaten/Kota ditemukan</option>';
                }
            })
            .catch(error => {
                console.error('Error fetching cities:', error);
                displayAlert('danger', 'Gagal memuat daftar Kabupaten/Kota. Silakan coba refresh halaman.');
                citySelectElement.innerHTML = '<option value="">Gagal memuat Kabupaten/Kota</option>';
            });
    } else {
        citySelectElement.innerHTML = '<option value="">Pilih Kabupaten/Kota</option>';
    }
}

if (profileProvinceSelect) {
    profileProvinceSelect.addEventListener('change', function() {
        loadCities(this.value, profileCitySelect);
    });
}

if (ktaProvinceSelect) {
    ktaProvinceSelect.addEventListener('change', function() {
        loadCities(this.value, ktaCitySelect);
    });
}

// --- JavaScript functions for Rupiah formatting ---

/**
 * Formats a number string into Rupiah format (e.g., 1000000 becomes Rp 1.000.000).
 * Also updates a hidden input with the clean numeric value.
 * @param {HTMLInputElement} inputElement The input field (type="text") being formatted.
 */
function formatRupiah(inputElement) {
    let angka = inputElement.value;
    // Remove "Rp", dots, and any non-digit characters
    let cleanAngka = angka.replace(/[^0-9]/g, '').toString(); 
    
    if (cleanAngka === '') {
        inputElement.value = '';
        const hiddenInput = document.getElementById('nominal-paid-hidden');
        if (hiddenInput) {
            hiddenInput.value = '';
        }
        return;
    }

    let rupiah = '';
    let reverse = cleanAngka.split('').reverse().join('');
    for (let i = 0; i < reverse.length; i++) {
        if (i % 3 === 0) {
            rupiah += reverse.substr(i, 3) + '.';
        }
    }
    rupiah = 'Rp ' + rupiah.split('').reverse().join('').replace(/^,/, '').replace(/\.$/, ''); 

    // Handle cases where the last char is '.' (e.g., after typing '123.')
    if (rupiah.endsWith('.')) {
        rupiah = rupiah.slice(0, -1);
    }

    inputElement.value = rupiah;
    // Set the clean numeric value to the hidden input
    const hiddenInput = document.getElementById('nominal-paid-hidden');
    if (hiddenInput) {
        hiddenInput.value = cleanAngka;
    }
}

/**
 * Cleans a Rupiah formatted string to a pure integer.
 * @param {string} rupiahValue The formatted Rupiah string (e.g., "Rp 1.000.000").
 * @returns {number} The clean integer value (e.g., 1000000).
 */
function cleanRupiah(rupiahValue) {
    // Remove "Rp", spaces, and thousands separators (dots)
    return parseInt(rupiahValue.replace(/[^0-9]/g, ''));
}

// No need for a redundant DOMContentLoaded listener here, as it's already in users.php.
// The displayAlert function is also now directly embedded in users.php's script block for clarity.