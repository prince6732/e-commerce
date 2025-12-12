<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Password Reset Code</title>
</head>

<body>
    <p>Hello,</p>
    <p>We received a request to reset your password. Use the code below to reset it:</p>

    <h2 style="font-size: 24px; font-weight: bold; color: #333;"><?php echo e($code); ?></h2>

    <p>This code will expire in 15 minutes.</p>
    <p>If you did not request a password reset, you can ignore this email.</p>

    <p>Thanks,<br>Zelton Team</p>
</body>

</html>
<?php /**PATH D:\zelton\e-commerce\laravel-api\resources\views/emails/password-reset-code.blade.php ENDPATH**/ ?>