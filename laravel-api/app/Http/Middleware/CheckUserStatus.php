<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && !$request->user()->status) {
            // Revoke all tokens for blocked user
            $request->user()->tokens()->delete();

            return response()->json([
                'res' => 'error',
                'message' => 'Your account has been blocked. Please contact administrator.',
            ], 403);
        }

        return $next($request);
    }
}
