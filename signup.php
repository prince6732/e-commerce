<?php
require_once "/var/www/html/vendor/autoload.php";
use magnusbilling\api\magnusBilling;

// Function to verify and activate user account using database
function verifyEmailAndActivateUser($email, $token) {
    // Database connection
    $conn = new mysqli("127.0.0.1", "root", "UPend_YYmEh5KwKp", "mbilling");
    
    if ($conn->connect_error) {
        error_log("Database connection failed: " . $conn->connect_error);
        return ['success' => false, 'message' => 'Database connection error. Please try again later.'];
    }
    
    // Check if token exists and is valid
    $query = "
        SELECT id, email, username, token, expires_at, is_used 
        FROM pkg_email_verification 
        WHERE email = ? AND token = ? AND is_used = 0
    ";
    
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        error_log("Prepare failed: " . $conn->error);
        $conn->close();
        return ['success' => false, 'message' => 'Database query error.'];
    }
    
    $stmt->bind_param("ss", $email, $token);
    $stmt->execute();
    $result = $stmt->get_result();
    $tokenData = $result->fetch_assoc();
    $stmt->close();
    
    if (!$tokenData) {
        $conn->close();
        return ['success' => false, 'message' => 'Invalid or expired verification link.'];
    }
    
    // Check if token has expired
    $expiresAt = strtotime($tokenData['expires_at']);
    if (time() > $expiresAt) {
        // Delete expired token
        $deleteQuery = "DELETE FROM pkg_email_verification WHERE id = ?";
        $deleteStmt = $conn->prepare($deleteQuery);
        if ($deleteStmt) {
            $deleteStmt->bind_param("i", $tokenData['id']);
            $deleteStmt->execute();
            $deleteStmt->close();
        }
        $conn->close();
        return ['success' => false, 'message' => 'Verification link has expired. Please register again.'];
    }
    
    // Token is valid, now activate user in MagnusBilling
    $magnusBilling = new MagnusBilling(
        'pk_7f2d3a1b-9c4e-4a6b-8d0f-2b6c3e1a4f7d',
        'sk_7b2f9c4a1d6e3b8f2a9c0d3e5b7f1a2c4d6e8f0b9a7c3d1e5f6a8b0c2d4e6f'
    );
    $magnusBilling->public_url = "https://call.anycallagency.in/mbilling";
    
    // Find and activate user
    try {
        // You'll need to implement user update logic here based on your MagnusBilling API
        // This is a placeholder - adjust according to your API
        $updateResult = $magnusBilling->updateUser([
            'email' => $email,
            'active' => '1', // Activate the user
            'description' => str_replace('PENDING_EMAIL_VERIFICATION|', 'EMAIL_VERIFIED|', $tokenData['username'])
        ]);
        
        if ($updateResult && isset($updateResult['success']) && $updateResult['success']) {
            // Mark token as used and set verification time
            $updateTokenQuery = "
                UPDATE pkg_email_verification 
                SET is_used = 1, verified_at = NOW() 
                WHERE id = ?
            ";
            $updateStmt = $conn->prepare($updateTokenQuery);
            if ($updateStmt) {
                $updateStmt->bind_param("i", $tokenData['id']);
                $updateStmt->execute();
                $updateStmt->close();
            }
            
            // Send Telegram notification about activation
            sendTelegramNotification("✅ EMAIL VERIFIED & ACCOUNT ACTIVATED\n\n👤 Username: {$tokenData['username']}\n📧 Email: {$email}\n🕒 Verified at: " . date('Y-m-d H:i:s'));
            
            return ['success' => true, 'message' => 'Email verified successfully! Your account is now active.'];
        } else {
            return ['success' => false, 'message' => 'Email verification successful but failed to activate account. Please contact support.'];
        }
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error activating account: ' . $e->getMessage()];
    }
}

// Send Telegram notification
function sendTelegramNotification($message) {
    $botToken = "7907714954:AAEFzIAHg1hVfrHVzGaD25VFwXIoe-7CRfs";
    $chatId = "6131728901";
    $url = "https://api.telegram.org/bot$botToken/sendMessage?chat_id=$chatId&text=" . urlencode($message);
    file_get_contents($url);
}

$verificationResult = null;

// Process verification if token and email are provided
if (isset($_GET['token']) && isset($_GET['email'])) {
    $token = $_GET['token'];
    $email = $_GET['email'];
    
    $verificationResult = verifyEmailAndActivateUser($email, $token);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email Verification – Any Call Agency</title>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: "Inter", sans-serif;
}

body {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
}

body::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.15"/><circle cx="20" cy="60" r="0.5" fill="white" opacity="0.15"/><circle cx="80" cy="40" r="0.5" fill="white" opacity="0.15"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    animation: float 20s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(0.5deg); }
}

.verification-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 60px 40px;
    max-width: 500px;
    width: 100%;
    text-align: center;
    box-shadow: 
        0 32px 64px rgba(0,0,0,0.15),
        0 16px 32px rgba(0,0,0,0.1),
        inset 0 1px 0 rgba(255,255,255,0.8);
    border: 1px solid rgba(255,255,255,0.2);
    position: relative;
    z-index: 10;
    animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(50px) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.icon-container {
    margin-bottom: 30px;
}

.success-icon {
    font-size: 80px;
    color: #22c55e;
    animation: bounce 1s ease-in-out;
}

.error-icon {
    font-size: 80px;
    color: #ef4444;
    animation: shake 0.5s ease-in-out;
}

.loading-icon {
    font-size: 60px;
    color: #6366f1;
    animation: spin 2s linear infinite;
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-15px); }
    60% { transform: translateY(-8px); }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

h1 {
    font-size: 32px;
    margin-bottom: 16px;
    color: #1f2937;
    font-weight: 700;
    letter-spacing: -0.02em;
}

p {
    font-size: 16px;
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 30px;
}

.success-message {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1));
    border: 2px solid #22c55e;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 30px;
    color: #15803d;
}

.error-message {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
    border: 2px solid #ef4444;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 30px;
    color: #dc2626;
}

.btn {
    display: inline-block;
    padding: 16px 32px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    margin: 0 8px;
}

.btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    box-shadow: 
        0 8px 32px rgba(99, 102, 241, 0.3),
        0 4px 16px rgba(99, 102, 241, 0.2);
}

.btn-secondary {
    background: transparent;
    color: #6366f1;
    border: 2px solid #6366f1;
}

.btn:hover {
    transform: translateY(-2px);
}

.btn-primary:hover {
    box-shadow: 
        0 12px 40px rgba(99, 102, 241, 0.4),
        0 8px 24px rgba(99, 102, 241, 0.3);
}

.btn-secondary:hover {
    background: #6366f1;
    color: white;
}

@media (max-width: 600px) {
    .verification-card {
        padding: 40px 30px;
        margin: 20px;
    }
    
    .success-icon, .error-icon {
        font-size: 60px;
    }
    
    h1 {
        font-size: 28px;
    }
    
    .btn {
        display: block;
        margin: 8px 0;
    }
}
</style>
</head>

<body>

<div class="verification-card">
    <?php if ($verificationResult === null): ?>
        <!-- Loading/Processing State -->
        <div class="icon-container">
            <i class="fas fa-spinner loading-icon"></i>
        </div>
        <h1>Verifying Email...</h1>
        <p>Please wait while we verify your email address.</p>
        
        <script>
            // Auto-process verification on page load
            window.onload = function() {
                setTimeout(function() {
                    location.reload();
                }, 2000);
            };
        </script>
    
    <?php elseif ($verificationResult['success']): ?>
        <!-- Success State -->
        <div class="icon-container">
            <i class="fas fa-check-circle success-icon"></i>
        </div>
        <h1>Email Verified Successfully!</h1>
        <div class="success-message">
            <p style="margin: 0;"><strong>Congratulations!</strong> Your email has been verified and your account is now active. You can now log in and start using all our services.</p>
        </div>
        <p>Welcome to Any Call Agency! Your account is ready to use.</p>
        
        <a href="login.php" class="btn btn-primary">
            <i class="fas fa-sign-in-alt" style="margin-right: 8px;"></i>
            Login to Your Account
        </a>
        
    <?php else: ?>
        <!-- Error State -->
        <div class="icon-container">
            <i class="fas fa-times-circle error-icon"></i>
        </div>
        <h1>Verification Failed</h1>
        <div class="error-message">
            <p style="margin: 0;"><strong>Error:</strong> <?php echo htmlspecialchars($verificationResult['message']); ?></p>
        </div>
        <p>Don't worry! You can try registering again or contact our support team for assistance.</p>
        
        <a href="testsignup.php" class="btn btn-primary">
            <i class="fas fa-user-plus" style="margin-right: 8px;"></i>
            Register Again
        </a>
        <a href="login.php" class="btn btn-secondary">
            <i class="fas fa-sign-in-alt" style="margin-right: 8px;"></i>
            Back to Login
        </a>
        
    <?php endif; ?>
</div>

<script>
// Add entrance animation
window.addEventListener('load', function() {
    document.querySelector('.verification-card').style.opacity = '0';
    document.querySelector('.verification-card').style.transform = 'translateY(50px)';
    
    setTimeout(() => {
        document.querySelector('.verification-card').style.transition = 'all 0.6s ease';
        document.querySelector('.verification-card').style.opacity = '1';
        document.querySelector('.verification-card').style.transform = 'translateY(0)';
    }, 100);
});
</script>

</body>
</html>