<?php
/**
 * Helper Functions for Kejurnas System
 * Includes province detection and utility functions
 */

/**
 * Check if a province is in Java region
 * 
 * @param string $province_name - The name of the province
 * @return bool - True if in Java, False otherwise
 */
function isJavaProvince($province_name) {
    if (empty($province_name)) {
        return false;
    }
    
    // Normalize the province name
    $province_name = strtolower(trim($province_name));
    
    // Define Java provinces with variations
    $java_provinces = [
        // DKI Jakarta
        'jakarta' => ['dki jakarta', 'jakarta', 'jakarta raya', 'd.k.i. jakarta'],
        
        // Jawa Barat
        'jabar' => ['jawa barat', 'jabar', 'java barat'],
        
        // Jawa Tengah
        'jateng' => ['jawa tengah', 'jateng', 'java tengah'],
        
        // Jawa Timur
        'jatim' => ['jawa timur', 'jatim', 'java timur'],
        
        // Banten
        'banten' => ['banten'],
        
        // DI Yogyakarta
        'yogya' => ['daerah istimewa yogyakarta', 'di yogyakarta', 'd.i. yogyakarta', 
                    'yogyakarta', 'yogya', 'jogja', 'diy']
    ];
    
    // Check against all variations
    foreach ($java_provinces as $region => $variations) {
        foreach ($variations as $variation) {
            // Exact match
            if ($province_name === $variation) {
                return true;
            }
            
            // Contains match (for cases like "Prop. Jawa Barat")
            if (strpos($province_name, $variation) !== false) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Get province region type (Jawa or Luar Jawa)
 * 
 * @param string $province_name - The name of the province
 * @return string - 'Jawa' or 'Luar Jawa'
 */
function getProvinceRegion($province_name) {
    return isJavaProvince($province_name) ? 'Jawa' : 'Luar Jawa';
}

/**
 * Get is_jawa flag (1 or 0) for database
 * 
 * @param string $province_name - The name of the province
 * @return int - 1 for Jawa, 0 for Luar Jawa
 */
function getIsJawaFlag($province_name) {
    return isJavaProvince($province_name) ? 1 : 0;
}

/**
 * Get all Java province IDs from database
 * 
 * @param mysqli $conn - Database connection
 * @return array - Array of province IDs
 */
function getJavaProvinceIds($conn) {
    $java_province_ids = [];
    
    $stmt = $conn->prepare("SELECT id, name FROM provinces");
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        if (isJavaProvince($row['name'])) {
            $java_province_ids[] = $row['id'];
        }
    }
    
    $stmt->close();
    return $java_province_ids;
}

/**
 * Validate province and get region info
 * 
 * @param mysqli $conn - Database connection
 * @param int $province_id - Province ID
 * @return array - ['province_name', 'is_jawa', 'region']
 */
function getProvinceInfo($conn, $province_id) {
    $stmt = $conn->prepare("SELECT name FROM provinces WHERE id = ?");
    $stmt->bind_param("i", $province_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $province_name = $row['name'];
        $is_jawa = getIsJawaFlag($province_name);
        $region = getProvinceRegion($province_name);
        
        $stmt->close();
        
        return [
            'province_name' => $province_name,
            'is_jawa' => $is_jawa,
            'region' => $region,
            'valid' => true
        ];
    }
    
    $stmt->close();
    return [
        'province_name' => '',
        'is_jawa' => 0,
        'region' => 'Unknown',
        'valid' => false
    ];
}

/**
 * Debug function to list all provinces with their region
 * 
 * @param mysqli $conn - Database connection
 * @return array - Array of all provinces with region info
 */
function debugListAllProvinces($conn) {
    $provinces = [];
    
    $stmt = $conn->prepare("SELECT id, name FROM provinces ORDER BY name");
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $provinces[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'region' => getProvinceRegion($row['name']),
            'is_jawa' => getIsJawaFlag($row['name'])
        ];
    }
    
    $stmt->close();
    return $provinces;
}

/**
 * Test province detection
 * Returns true if detection is working correctly
 */
function testProvinceDetection() {
    $test_cases = [
        // Java provinces (should return true)
        'DKI Jakarta' => true,
        'Jakarta' => true,
        'Jawa Barat' => true,
        'Jawa Tengah' => true,
        'Jawa Timur' => true,
        'Banten' => true,
        'Daerah Istimewa Yogyakarta' => true,
        'Yogyakarta' => true,
        'DI Yogyakarta' => true,
        
        // Non-Java provinces (should return false)
        'Sumatera Utara' => false,
        'Bali' => false,
        'Kalimantan Timur' => false,
        'Sulawesi Selatan' => false,
        'Papua' => false,
        'Aceh' => false,
        'Lampung' => false,
    ];
    
    $passed = 0;
    $failed = 0;
    $results = [];
    
    foreach ($test_cases as $province => $expected) {
        $actual = isJavaProvince($province);
        $status = ($actual === $expected) ? 'PASS' : 'FAIL';
        
        if ($status === 'PASS') {
            $passed++;
        } else {
            $failed++;
        }
        
        $results[] = [
            'province' => $province,
            'expected' => $expected ? 'Jawa' : 'Luar Jawa',
            'actual' => $actual ? 'Jawa' : 'Luar Jawa',
            'status' => $status
        ];
    }
    
    return [
        'passed' => $passed,
        'failed' => $failed,
        'total' => count($test_cases),
        'details' => $results
    ];
}
?>
