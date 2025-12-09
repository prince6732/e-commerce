<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Mail\EmailVerificationCode;
use App\Mail\PasswordResetCode;
use Exception;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|confirmed|min:6',
            ]);
            $code = rand(100000, 999999);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => bcrypt($validated['password']),
                'email_verification_code' => $code,
            ]);

            try {
                $user->assignRole('User');
            } catch (Exception $e) {
                Log::error('Error assigning role.', ['error' => $e->getMessage()]);
            }
            try {
                Mail::to($user->email)->send(new EmailVerificationCode($code));
            } catch (Exception $e) {
                Log::error('Error sending verification email.', [
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token,
            ], 201);
        } catch (Exception $e) {
            Log::error('Registration failed.', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Registration failed. Please check server logs for details.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function verify(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code'  => 'required|string',
        ]);

        $user = User::where('email', $request->email)
            ->where('email_verification_code', $request->code)
            ->first();

        if (! $user) {
            return response()->json(['message' => 'Invalid verification code'], 422);
        }

        $user->email_verified_at = now();
        $user->email_verification_code = null;
        $user->is_verified = true;
        $user->save();

        return response()->json(['message' => 'Email verified successfully']);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'nullable|email',
            'password' => 'nullable|string',
        ]);

        if (!$request->email && !$request->password) {
            return response()->json(['message' => 'Email or Password is required'], 422);
        }

        $user = null;

        if ($request->email) {
            $user = User::where('email', $request->email)->first();
            if (!$user) {
                return response()->json(['message' => 'Invalid email'], 401);
            }
            if ($request->password && !Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Invalid password'], 401);
            }
        }

        if ($request->password && !$request->email) {
            $user = User::whereNotNull('password')
                ->get()
                ->first(function ($u) use ($request) {
                    return Hash::check($request->password, $u->password);
                });

            if (!$user) {
                return response()->json(['message' => 'Invalid password'], 401);
            }
        }

        if (!$user->email_verified_at) {
            return response()->json(['message' => 'Email not verified'], 403);
        }

        if (!$user->status) {
            return response()->json([
                'res' => 'error',
                'message' => 'Your account has been blocked by the administrator. Please contact support for assistance.',
                'error' => 'account_blocked'
            ], 403);
        }

        $role = $user->roles()->pluck('name')->first();

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token'   => $token,
            'user'    => [
                'id'                => $user->id,
                'name'              => $user->name,
                'email'             => $user->email,
                'phone_number'      => $user->phone_number,
                'address'           => $user->address,
                'profile_picture'   => $user->profile_picture,
                'status'            => $user->status,
                'role'              => $role,
                'email_verified_at' => $user->email_verified_at,
                'is_verified'       => $user->is_verified,
                'created_at'        => $user->created_at,
                'updated_at'        => $user->updated_at,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('roles', 'permissions');

        return response()->json([
            'user' => [
                'id'                => $user->id,
                'name'              => $user->name,
                'email'             => $user->email,
                'phone_number'      => $user->phone_number,
                'address'           => $user->address,
                'profile_picture'   => $user->profile_picture,
                'status'            => $user->status,
                'role'              => $user->getRoleNames()->first(),
                'email_verified_at' => $user->email_verified_at,
                'is_verified'       => $user->is_verified,
                'created_at'        => $user->created_at,
                'updated_at'        => $user->updated_at,
            ]
        ]);
    }

    public function allUser(Request $request)
    {
        $items = User::whereHas('roles', function ($q) {
            $q->where('name', 'User');
        })->get(['id', 'name', 'email', 'profile_picture', 'phone_number', 'address', 'status']);

        return response()->json($items);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        $existing = DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->first();

        if ($existing && \Carbon\Carbon::parse($existing->created_at)->addMinutes(20)->isFuture()) {
            $remaining = \Carbon\Carbon::parse($existing->created_at)->addMinutes(20)->diffForHumans(null, true);
            return response()->json([
                'message' => "You can request a new code after {$remaining}."
            ], 429);
        }

        $code = rand(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token'      => $code,
                'created_at' => now(),
                'expires_at' => now()->addMinutes(15),
            ]
        );

        Mail::to($user->email)->send(new PasswordResetCode($code));

        return response()->json(['message' => 'Password reset code sent to your email']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'    => 'required|email|exists:users,email',
            'code'     => 'required|string',
            'password' => 'required|confirmed|min:6',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->code)
            ->first();

        if (! $record) {
            return response()->json(['message' => 'Invalid reset code'], 422);
        }

        if ($record->expires_at && $record->expires_at < now()) {
            return response()->json(['message' => 'Reset code has expired'], 422);
        }

        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password reset successful']);
    }

    public function googleLogin(Request $request)
    {
        try {
            $request->validate([
                'token' => 'required|string',
            ]);

            // Configure Guzzle client with SSL certificate
            $httpClient = new \GuzzleHttp\Client([
                'verify' => base_path('cacert.pem')
            ]);

            // Verify the Google token
            $client = new \Google_Client([
                'client_id' => config('services.google.client_id')
            ]);
            $client->setHttpClient($httpClient);
            
            $payload = $client->verifyIdToken($request->token);

            if (!$payload) {
                return response()->json([
                    'message' => 'Invalid Google token'
                ], 401);
            }

            $googleId = $payload['sub'];
            $email = $payload['email'];
            $name = $payload['name'];
            $picture = $payload['picture'] ?? null;

            // Check if user exists
            $user = User::where('email', $email)->first();

            if ($user) {
                // Update google_id if not set
                if (!$user->google_id) {
                    $user->google_id = $googleId;
                    $user->save();
                }

                // If email not verified, verify it
                if (!$user->email_verified_at) {
                    $user->email_verified_at = now();
                    $user->is_verified = true;
                    $user->save();
                }
            } else {
                // Create new user
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'google_id' => $googleId,
                    'profile_picture' => $picture,
                    'email_verified_at' => now(),
                    'is_verified' => true,
                    'status' => true,
                    'password' => bcrypt(Str::random(32)), // Random password for Google users
                ]);

                try {
                    $user->assignRole('User');
                } catch (Exception $e) {
                    Log::error('Error assigning role to Google user.', ['error' => $e->getMessage()]);
                }
            }

            if (!$user->status) {
                return response()->json([
                    'res' => 'error',
                    'message' => 'Your account has been blocked by the administrator. Please contact support for assistance.',
                    'error' => 'account_blocked'
                ], 403);
            }

            $role = $user->roles()->pluck('name')->first();
            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'address' => $user->address,
                    'profile_picture' => $user->profile_picture,
                    'status' => $user->status,
                    'role' => $role,
                    'email_verified_at' => $user->email_verified_at,
                    'is_verified' => $user->is_verified,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Google login failed.', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Google login failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
