<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'item_code',
        'category_id',
        'brand_id',
        'status',
        'feature_json',
        'detail_json',
        'image_url',
        'image_json',
    ];

    protected $casts = [
        'feature_json' => 'array',
        'detail_json'  => 'array',
        'image_json'   => 'array',
        'status'       => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function variants()
    {
        return $this->hasMany(Variant::class);
    }

    public function itemAttributes()
    {
        return $this->hasMany(ItemAttribute::class, 'product_id')
            ->with('attribute');
    }

    public function productAttributeValues()
    {
        return $this->hasMany(ProductAttributeValue::class, 'product_id')
            ->with(['attribute', 'attributeValue']);
    }

    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    public function getFeatureListAttribute()
    {
        return $this->feature_json ?? [];
    }

    public function getDetailListAttribute()
    {
        return $this->detail_json ?? [];
    }

    public function getImageListAttribute()
    {
        return $this->image_json ?? [];
    }

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    public function likedByUsers()
    {
        return $this->belongsToMany(User::class, 'likes')->withTimestamps();
    }

    public function getLikesCountAttribute()
    {
        return $this->likes()->count();
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function approvedReviews()
    {
        return $this->hasMany(Review::class)->approved();
    }

    public function getAverageRatingAttribute()
    {
        return $this->approvedReviews()->avg('rating') ?: 0;
    }

    public function getReviewsCountAttribute()
    {
        return $this->approvedReviews()->count();
    }

    public function getRatingDistributionAttribute()
    {
        $distribution = [];
        for ($i = 1; $i <= 5; $i++) {
            $distribution[$i] = $this->approvedReviews()->where('rating', $i)->count();
        }
        return $distribution;
    }

    public function getRatingSummaryAttribute()
    {
        return [
            'average_rating' => round($this->average_rating, 1),
            'total_reviews' => $this->reviews_count,
            'rating_distribution' => $this->rating_distribution
        ];
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function orders()
    {
        return $this->belongsToMany(Order::class, 'order_items')->withPivot('quantity', 'price', 'total');
    }
}
