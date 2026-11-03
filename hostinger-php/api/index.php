<?php
declare(strict_types=1);

$configFile = dirname(__DIR__) . '/config.php';
if (!is_file($configFile)) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Application configuration is missing. Copy config.example.php to config.php and configure it.']);
    exit;
}

$config = require $configFile;
date_default_timezone_set($config['timezone'] ?? 'Asia/Kolkata');

function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    $dbConfig = $config['db'] ?? [];
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $dbConfig['host'] ?? 'localhost',
        $dbConfig['name'] ?? '',
        $dbConfig['charset'] ?? 'utf8mb4'
    );
    $db = new PDO($dsn, (string)($dbConfig['user'] ?? ''), (string)($dbConfig['password'] ?? ''), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $requestMethod = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if ($requestMethod !== 'GET' && $requestMethod !== 'HEAD') {
        respond(['error' => 'Not found'], 404);
    }

    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/api', PHP_URL_PATH) ?: '/api';
    $apiPath = preg_replace('#^/api(?:/index\.php)?#', '', $uriPath);
    $apiPath = '/' . trim((string)$apiPath, '/');

    if ($apiPath === '/config') {
        respond([
            'phone' => $config['business_phone'] ?? '+91 7999981204',
            'whatsapp' => $config['whatsapp_number'] ?? '',
            'email' => $config['business_email'] ?? '',
            'cancellation' => [
                'freeHrs' => 6,
                'midHrs' => 2,
                'midPct' => (int)($config['cancel_mid_pct'] ?? 20),
                'lowPct' => 80,
            ],
        ]);
    }

    if ($apiPath === '/vehicles') {
        $where = [];
        $params = [];
        if (isset($_GET['category']) && $_GET['category'] !== '') {
            $where[] = 'category = ?';
            $params[] = (string)$_GET['category'];
        }
        if (($_GET['selfDrive'] ?? '') === '1') {
            $where[] = 'self_drive = 1';
        }
        $sql = 'SELECT * FROM vehicles' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY id';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        respond($stmt->fetchAll());
    }

    if ($apiPath === '/routes') {
        respond($db->query('SELECT * FROM routes ORDER BY id')->fetchAll());
    }

    respond(['error' => 'Not found'], 404);
} catch (Throwable $error) {
    error_log('Bhilai Travel Hub API error: ' . $error->getMessage());
    respond(['error' => 'Server error'], 500);
}
