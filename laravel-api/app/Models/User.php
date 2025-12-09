<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $guard_name = 'web';

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'status',
        'is_verified',
        'email_verification_code',
        'email_verified_at',
        'phone_number',
        'address',
        'profile_picture',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'status' => 'boolean',
    ];

    public function cartItems()
    {
        return $this->hasMany(Cart::class);
    }

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    public function likedProducts()
    {
        return $this->belongsToMany(Product::class, 'likes')->withTimestamps();
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    // Check if user is blocked
    public function isBlocked()
    {
        return $this->status === false;
    }

    // Scope for active users only
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}

