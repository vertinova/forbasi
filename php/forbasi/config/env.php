<?php
/**
 * FORBASI Environment Configuration
 * Automatically detects environment and sets appropriate paths
 */

// Detect environment
$isProduction = (
    isset($_SERVER['HTTP_HOST']) && 
    (strpos($_SERVER['HTTP_HOST'], 'forbasi.or.id') !== false ||
     strpos($_SERVER['HTTP_HOST'], 'www.forbasi.or.id') !== false)
);

// Set base paths based on environment
if ($isProduction) {
    // Production environment (forbasi.or.id)
    define('BASE_URL', 'https://forbasi.or.id');
    define('BASE_PATH', '/');
    define('ASSETS_PATH', '/assets/');
    define('CSS_PATH', '/css/');
    define('JS_PATH', '/js/');
    define('PHP_PATH', '/php/');
    define('MANIFEST_PATH', '/manifest.json');
    define('SERVICE_WORKER_PATH', '/service-worker.js');
} else {
    // Development environment (localhost)
    define('BASE_URL', 'http://localhost');
    define('BASE_PATH', '/forbasi/');
    define('ASSETS_PATH', '/forbasi/assets/');
    define('CSS_PATH', '/forbasi/css/');
    define('JS_PATH', '/forbasi/js/');
    define('PHP_PATH', '/forbasi/php/');
    define('MANIFEST_PATH', '/forbasi/manifest.json');
    define('SERVICE_WORKER_PATH', '/forbasi/service-worker.js');
}

// Environment flag
define('IS_PRODUCTION', $isProduction);
define('ENVIRONMENT', $isProduction ? 'production' : 'development');

// Helper function to get full URL
function getUrl($path = '') {
    return BASE_URL . BASE_PATH . ltrim($path, '/');
}

// Helper function to get asset URL
function asset($path) {
    return BASE_URL . ASSETS_PATH . ltrim($path, '/');
}

// Helper function to get CSS URL
function css($path) {
    return BASE_URL . CSS_PATH . ltrim($path, '/');
}

// Helper function to get JS URL
function js($path) {
    return BASE_URL . JS_PATH . ltrim($path, '/');
}

// Helper function to get PHP URL
function php($path) {
    return BASE_URL . PHP_PATH . ltrim($path, '/');
}
?>
