/**
 * Regional subdomain configuration
 * Maps subdomain codes to province IDs for multi-tenant login
 * 
 * Usage:
 *   - jabar.forbasi.or.id -> province_id 12 (Jawa Barat)
 *   - jatim.forbasi.or.id -> province_id 15 (Jawa Timur)
 *   - etc.
 */

const REGIONS = {
  // Pulau Sumatera
  aceh:       { province_id: 1,  name: 'Aceh' },
  sumut:      { province_id: 2,  name: 'Sumatera Utara' },
  sumbar:     { province_id: 3,  name: 'Sumatera Barat' },
  riau:       { province_id: 4,  name: 'Riau' },
  jambi:      { province_id: 5,  name: 'Jambi' },
  sumsel:     { province_id: 6,  name: 'Sumatera Selatan' },
  bengkulu:   { province_id: 7,  name: 'Bengkulu' },
  lampung:    { province_id: 8,  name: 'Lampung' },
  babel:      { province_id: 9,  name: 'Kepulauan Bangka Belitung' },
  kepri:      { province_id: 10, name: 'Kepulauan Riau' },

  // Pulau Jawa
  jakarta:    { province_id: 11, name: 'DKI Jakarta' },
  jabar:      { province_id: 12, name: 'Jawa Barat' },
  jateng:     { province_id: 13, name: 'Jawa Tengah' },
  jogja:      { province_id: 14, name: 'DI Yogyakarta' },
  jatim:      { province_id: 15, name: 'Jawa Timur' },
  banten:     { province_id: 16, name: 'Banten' },

  // Bali & Nusa Tenggara
  bali:       { province_id: 17, name: 'Bali' },
  ntb:        { province_id: 18, name: 'Nusa Tenggara Barat' },
  ntt:        { province_id: 19, name: 'Nusa Tenggara Timur' },

  // Kalimantan
  kalbar:     { province_id: 20, name: 'Kalimantan Barat' },
  kalteng:    { province_id: 21, name: 'Kalimantan Tengah' },
  kalsel:     { province_id: 22, name: 'Kalimantan Selatan' },
  kaltim:     { province_id: 23, name: 'Kalimantan Timur' },
  kaltara:    { province_id: 24, name: 'Kalimantan Utara' },

  // Sulawesi
  sulut:      { province_id: 25, name: 'Sulawesi Utara' },
  sulteng:    { province_id: 26, name: 'Sulawesi Tengah' },
  sulsel:     { province_id: 27, name: 'Sulawesi Selatan' },
  sultra:     { province_id: 28, name: 'Sulawesi Tenggara' },
  gorontalo:  { province_id: 29, name: 'Gorontalo' },
  sulbar:     { province_id: 30, name: 'Sulawesi Barat' },

  // Maluku & Papua
  maluku:     { province_id: 31, name: 'Maluku' },
  malut:      { province_id: 32, name: 'Maluku Utara' },
  papua:      { province_id: 33, name: 'Papua' },
  papuabarat: { province_id: 35, name: 'Papua Barat' },
};

/**
 * Get region config by subdomain code
 * @param {string} regionCode - e.g., 'jabar', 'jatim'
 * @returns {object|null} - { province_id, name } or null if not found
 */
function getRegion(regionCode) {
  if (!regionCode) return null;
  return REGIONS[regionCode.toLowerCase()] || null;
}

/**
 * Get all available regions
 * @returns {Array} - List of { code, province_id, name }
 */
function getAllRegions() {
  return Object.entries(REGIONS).map(([code, data]) => ({
    code,
    ...data
  }));
}

/**
 * Check if a region code is valid
 * @param {string} regionCode
 * @returns {boolean}
 */
function isValidRegion(regionCode) {
  return !!getRegion(regionCode);
}

module.exports = {
  REGIONS,
  getRegion,
  getAllRegions,
  isValidRegion,
};
