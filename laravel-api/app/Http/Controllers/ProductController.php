<?php

namespace App\Http\Controllers;

use App\Models\CategoryAttribute;
use App\Models\Product;
use App\Models\Variant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with('variants')
            ->select('id', 'name', 'description', 'image_url', 'status')
            ->active()
            ->get()
            ->map(function ($product) {
                if (!$product->image_url && $product->variants->count() > 0) {
                    $product->image_url = $product->variants->first()->image_url;
                }

                $variants = $product->variants->map(function ($variant) {
                    return [
                        'id'        => $variant->id,
                        'title'     => $variant->title,
                        'mrp'       => $variant->mrp,
                        'sp'        => $variant->sp,
                        'stock'     => $variant->stock,
                        'image_url' => $variant->image_url,
                        'image_json' => $variant->image_json,
                    ];
                });

                return [
                    'id'          => $product->id,
                    'name'        => $product->name,
                    'description' => $product->description,
                    'image_url'   => $product->image_url,
                    'status'      => $product->status,
                    'variants'    => $variants,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Products fetched successfully.',
            'data'    => $products,
        ]);
    }

    public function show($id)
    {
        $product = Product::with([
            'variants.attributeValues.attribute',
            'brand',
            'category',
            'itemAttributes.attribute',
        ])->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product details fetched successfully.',
            'product' => $product,
        ]);
    }

    public function getAllProductsPaginated(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        $search = $request->input('search');
        $categoryId = $request->input('category_id');
        $subcategoryId = $request->input('subcategory_id');
        $brandId = $request->input('brand_id');
        $minPrice = $request->input('min_price');
        $maxPrice = $request->input('max_price');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');

        $query = Product::with(['variants', 'brand', 'category'])
            ->select('id', 'name', 'description', 'image_url', 'status', 'category_id', 'brand_id', 'created_at')
            ->active();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('item_code', 'like', "%{$search}%");
            });
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($subcategoryId) {
            $query->where('category_id', $subcategoryId);
        }

        if ($brandId) {
            $query->where('brand_id', $brandId);
        }

        if ($minPrice !== null || $maxPrice !== null) {
            $query->whereHas('variants', function ($q) use ($minPrice, $maxPrice) {
                if ($minPrice !== null) {
                    $q->where('sp', '>=', $minPrice);
                }
                if ($maxPrice !== null) {
                    $q->where('sp', '<=', $maxPrice);
                }
            });
        }

        $query->orderBy($sortBy, $sortOrder);

        $products = $query->paginate($perPage);

        $products->getCollection()->transform(function ($product) {
            if (!$product->image_url && $product->variants->count() > 0) {
                $product->image_url = $product->variants->first()->image_url;
            }

            $variants = $product->variants->map(function ($variant) {
                return [
                    'id'        => $variant->id,
                    'title'     => $variant->title,
                    'mrp'       => $variant->mrp,
                    'sp'        => $variant->sp,
                    'stock'     => $variant->stock,
                    'image_url' => $variant->image_url,
                    'image_json' => $variant->image_json,
                ];
            });

            $minPrice = $product->variants->min('sp') ?? $product->variants->min('mrp');
            $maxPrice = $product->variants->max('sp') ?? $product->variants->max('mrp');

            return [
                'id'          => $product->id,
                'name'        => $product->name,
                'description' => $product->description,
                'image_url'   => $product->image_url,
                'status'      => $product->status,
                'brand'       => $product->brand ? ['id' => $product->brand->id, 'name' => $product->brand->name] : null,
                'category'    => $product->category ? ['id' => $product->category->id, 'name' => $product->category->name] : null,
                'min_price'   => $minPrice,
                'max_price'   => $maxPrice,
                'variants'    => $variants,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Products fetched successfully.',
            'data'    => $products->items(),
            'pagination' => [
                'total' => $products->total(),
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->all();

        $data['brand_id'] = $data['brandId'] ?? null;
        $data['item_code'] = $data['itemCode'] ?? null;
        $data['feature_json'] = isset($data['featureList']) ? json_encode($data['featureList']) : null;
        $data['image_json'] = isset($data['imageList']) ? json_encode($data['imageList']) : null;
        $data['detail_json'] = isset($data['detailList']) ? json_encode($data['detailList']) : null;

        if (isset($data['variants']) && is_string($data['variants'])) {
            $data['variants'] = json_decode($data['variants'], true);
        }

        $validated = validator($data, [
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'item_code' => 'nullable|string|max:50',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'status' => 'required|boolean',
            'feature_json' => 'nullable|string',
            'image_url' => 'nullable|string|max:255',
            'image_json' => 'nullable|string',
            'detail_json' => 'nullable|string',

            'variants' => 'nullable|array',
            'variants.*.title' => 'nullable|string|max:100',
            'variants.*.sku' => 'required_with:variants|string|max:100|unique:variants,sku',
            'variants.*.stock' => 'nullable|integer|min:0',
            'variants.*.mrp' => 'required_with:variants|numeric|min:0',
            'variants.*.sp' => 'required_with:variants|numeric|min:0',
            'variants.*.bp' => 'required_with:variants|numeric|min:0',
            'variants.*.status' => 'boolean',
            'variants.*.image_url' => 'nullable|string|max:255',
            'variants.*.image_json' => 'nullable|string',
            'variants.*.attributeValues' => 'nullable|array',
            'variants.*.attributeValues.*' => 'integer|exists:attribute_values,id',
        ])->validate();

        DB::beginTransaction();
        try {
            $exists = Product::whereRaw('LOWER(name) = ?', [strtolower($validated['name'])])
                ->where('category_id', $validated['category_id'])
                ->where('brand_id', $validated['brand_id'] ?? null)
                ->first();

            if ($exists) {
                return response()->json([
                    'res' => 'error',
                    'message' => 'This product already exists in the selected category/brand.',
                ], 422);
            }

            $product = Product::create($validated);

            $allAttributeValueIds = collect();

            if (!empty($validated['variants'])) {
                foreach ($validated['variants'] as $variantData) {
                    $variantData['product_id'] = $product->id;
                    $variant = Variant::create($variantData);

                    if (!empty($variantData['attributeValues'])) {
                        foreach ($variantData['attributeValues'] as $attrValueId) {
                            DB::table('variant_attribute_values')->insert([
                                'variant_id' => $variant->id,
                                'attribute_value_id' => $attrValueId,
                            ]);
                            $allAttributeValueIds->push($attrValueId);
                        }
                    }
                }
            }
            if ($allAttributeValueIds->isNotEmpty()) {
                $attributeIds = $allAttributeValueIds
                    ->unique()
                    ->map(fn($attrValueId) => DB::table('attribute_values')
                        ->where('id', $attrValueId)
                        ->value('attribute_id'))
                    ->filter()
                    ->unique()
                    ->values();

                foreach ($attributeIds as $attributeId) {
                    $categoryAttribute = CategoryAttribute::query()
                        ->forCategory($product->category_id)
                        ->forAttribute($attributeId)
                        ->first();

                    $hasImages = $categoryAttribute->has_images ?? false;
                    $isPrimary = $categoryAttribute->is_primary ?? false;

                    DB::table('item_attributes')->insert([
                        'product_id' => $product->id,
                        'attribute_id' => $attributeId,
                        'has_images' => $hasImages,
                        'is_primary' => $isPrimary,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'res' => 'success',
                'message' => "{$product->name} has been created successfully.",
                'product' => $product->load('variants'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'res' => 'error',
                'message' => 'The product could not be added.',
                'error_detail' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->all();
        $data['brand_id']   = $data['brandId'] ?? null;
        $data['item_code']  = $data['itemCode'] ?? null;
        $data['feature_json'] = isset($data['featureList']) ? json_encode($data['featureList']) : null;
        $data['image_json']   = isset($data['imageList']) ? json_encode($data['imageList']) : null;
        $data['detail_json']  = isset($data['detailList']) ? json_encode($data['detailList']) : null;

        if (isset($data['variants']) && is_string($data['variants'])) {
            $data['variants'] = json_decode($data['variants'], true);
        }

        $validated = validator($data, [
            'name'         => 'required|string|max:100',
            'description'  => 'nullable|string',
            'item_code'    => 'nullable|string|max:50',
            'category_id'  => 'required|exists:categories,id',
            'brand_id'     => 'nullable|exists:brands,id',
            'status'       => 'required|boolean',
            'feature_json' => 'nullable|string',
            'image_url'    => 'nullable|string|max:255',
            'image_json'   => 'nullable|string',
            'detail_json'  => 'nullable|string',

            'variants'             => 'nullable|array',
            'variants.*.id'        => 'nullable|exists:variants,id',
            'variants.*.title'     => 'nullable|string|max:100',
            'variants.*.sku'       => [
                'required_with:variants',
                'string',
                'max:100',
                function ($attribute, $value, $fail) use ($data) {
                    $variantId = data_get($data, str_replace('.sku', '.id', $attribute));
                    $exists = Variant::where('sku', $value)
                        ->when($variantId, fn($q) => $q->where('id', '!=', $variantId))
                        ->exists();

                    if ($exists) {
                        $fail("The SKU '$value' is already in use by another variant.");
                    }
                },
            ],
            'variants.*.stock'     => 'nullable|integer|min:0',
            'variants.*.mrp'       => 'required_with:variants|numeric|min:0',
            'variants.*.sp'        => 'required_with:variants|numeric|min:0',
            'variants.*.bp'        => 'required_with:variants|numeric|min:0',
            'variants.*.status'    => 'boolean',
            'variants.*.image_url' => 'nullable|string|max:255',
            'variants.*.image_json' => 'nullable|string',
        ])->validate();

        DB::beginTransaction();
        try {
            $exists = Product::whereRaw('LOWER(name) = ?', [strtolower($validated['name'])])
                ->where('category_id', $validated['category_id'])
                ->where('brand_id', $validated['brand_id'] ?? null)
                ->where('id', '!=', $product->id)
                ->first();

            if ($exists) {
                return response()->json([
                    'res'     => 'error',
                    'message' => 'This product already exists in the selected category/brand.',
                ], 422);
            }

            $product->update($validated);

            if (!empty($validated['variants'])) {
                $variantIds = [];

                foreach ($validated['variants'] as $variantData) {
                    if (isset($variantData['imageList']) && is_array($variantData['imageList'])) {
                        $variantData['image_json'] = json_encode($variantData['imageList']);
                    }

                    if (isset($variantData['id'])) {
                        $variant = Variant::find($variantData['id']);
                        if ($variant) {
                            $variant->update($variantData);
                            $variantIds[] = $variant->id;
                        }
                    } else {
                        $variantData['product_id'] = $product->id;
                        $newVariant = Variant::create($variantData);
                        $variantIds[] = $newVariant->id;
                    }
                }

                Variant::where('product_id', $product->id)
                    ->whereNotIn('id', $variantIds)
                    ->delete();
            }

            DB::commit();

            return response()->json([
                'res'     => 'success',
                'message' => 'Product updated successfully.',
                'product' => $product->load('variants'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'res'     => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getProductById(Product $product)
    {
        try {
            $product->load([
                'category',
                'brand',
                'variants.attributeValues.attribute',
                'itemAttributes.attribute',
            ]);

            $product->setRelation(
                'itemAttributes',
                $product->itemAttributes->sortByDesc('has_images')->values()
            );

            if (empty($product->image_url) && $product->variants->isNotEmpty()) {
                $firstVariantWithImage = $product->variants->firstWhere('image_url', '!=', null);

                if ($firstVariantWithImage) {
                    $product->image_url = $firstVariantWithImage->image_url;
                }
            }

            $product->append('rating_summary');

            return response()->json([
                'res'     => 'success',
                'message' => 'Product fetched successfully.',
                'product' => $product,
                'errors'  => [],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'res'     => 'error',
                'message' => 'Failed to fetch product.',
                'errors'  => [$e->getMessage()],
            ], 500);
        }
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json([
            'res'     => 'success',
            'message' => 'Product deleted successfully',
        ]);
    }

    public function getSubcategoryProduct($categoryId)
    {
        try {
            $products = Product::with(['category', 'brand', 'variants'])
                ->where('category_id', $categoryId)
                ->get();

            $products->transform(function ($product) {
                if (empty($product->image_url) && $product->variants->isNotEmpty()) {
                    $firstVariantWithImage = $product->variants->firstWhere('image_url', '!=', null);

                    if ($firstVariantWithImage) {
                        $product->image_url = $firstVariantWithImage->image_url;
                    }
                }

                return $product;
            });

            return response()->json([
                'res'       => 'success',
                'message'   => $products->isEmpty()
                    ? 'No products found for this category.'
                    : 'Products fetched successfully.',
                'products'  => $products,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'res'     => 'error',
                'message' => 'Failed to fetch products.',
                'errors'  => [$e->getMessage()],
            ], 500);
        }
    }

    public function getSimilarProducts(Request $request, $productId)
    {
        try {
            $product = Product::findOrFail($productId);
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 10);
            
            // Get similar products based on category and subcategory
            $query = Product::with(['category', 'brand', 'variants'])
                ->where('id', '!=', $productId)
                ->where('category_id', $product->category_id)
                ->active();

            $totalCount = $query->count();

            // If no products found in same category, get from parent category
            if ($totalCount === 0 && $product->category && $product->category->parent_id) {
                $query = Product::with(['category', 'brand', 'variants'])
                    ->where('id', '!=', $productId)
                    ->whereHas('category', function ($q) use ($product) {
                        $q->where('parent_id', $product->category->parent_id);
                    })
                    ->active();
                    
                $totalCount = $query->count();
            }

            $similarProducts = $query
                ->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get();

            $similarProducts->transform(function ($prod) {
                if (empty($prod->image_url) && $prod->variants->isNotEmpty()) {
                    $firstVariantWithImage = $prod->variants->firstWhere('image_url', '!=', null);
                    if ($firstVariantWithImage) {
                        $prod->image_url = $firstVariantWithImage->image_url;
                    }
                }
                $prod->append('rating_summary');
                return $prod;
            });

            return response()->json([
                'res'         => 'success',
                'message'     => 'Similar products fetched successfully.',
                'products'    => $similarProducts,
                'pagination'  => [
                    'current_page' => (int) $page,
                    'per_page'     => (int) $perPage,
                    'total'        => $totalCount,
                    'last_page'    => ceil($totalCount / $perPage),
                    'has_more'     => $page < ceil($totalCount / $perPage),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'res'     => 'error',
                'message' => 'Failed to fetch similar products.',
                'errors'  => [$e->getMessage()],
            ], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('q', '');
            $categoryId = $request->input('category_id');
            $brandId = $request->input('brand_id');
            $limit = $request->input('limit', 20);
            $page = $request->input('page', 1);

            if (empty($query)) {
                return response()->json([
                    'res' => 'error',
                    'message' => 'Search query is required.',
                ], 400);
            }
            $productsQuery = Product::with(['category.parent', 'brand', 'variants'])
                ->active()
                ->where(function ($q) use ($query) {
                    $q->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($query) . '%'])
                        ->orWhereRaw('LOWER(description) LIKE ?', ['%' . strtolower($query) . '%'])
                        ->orWhereHas('variants', function ($variantQuery) use ($query) {
                            $variantQuery->whereRaw('LOWER(title) LIKE ?', ['%' . strtolower($query) . '%'])
                                ->where('status', true);
                        })
                        ->orWhereHas('category', function ($categoryQuery) use ($query) {
                            $categoryQuery->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($query) . '%'])
                                ->where('status', true);
                        })
                        ->orWhereHas('category.parent', function ($parentCategoryQuery) use ($query) {
                            $parentCategoryQuery->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($query) . '%'])
                                ->where('status', true);
                        });
                });

            if ($categoryId) {
                $productsQuery->where('category_id', $categoryId);
            }

            if ($brandId) {
                $productsQuery->where('brand_id', $brandId);
            }

            $products = $productsQuery->skip(($page - 1) * $limit)
                ->take($limit)
                ->get();

            $totalCount = Product::active()
                ->where(function ($q) use ($query) {
                    $q->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($query) . '%'])
                        ->orWhereRaw('LOWER(description) LIKE ?', ['%' . strtolower($query) . '%'])
                        ->orWhereHas('variants', function ($variantQuery) use ($query) {
                            $variantQuery->whereRaw('LOWER(title) LIKE ?', ['%' . strtolower($query) . '%'])
                                ->where('status', true);
                        })
                        ->orWhereHas('category', function ($categoryQuery) use ($query) {
                            $categoryQuery->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($query) . '%'])
                                ->where('status', true);
                        })
                        ->orWhereHas('category.parent', function ($parentCategoryQuery) use ($query) {
                            $parentCategoryQuery->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($query) . '%'])
                                ->where('status', true);
                        });
                })
                ->when($categoryId, fn($q) => $q->where('category_id', $categoryId))
                ->when($brandId, fn($q) => $q->where('brand_id', $brandId))
                ->count();

            $products->transform(function ($product) use ($query) {
                if (empty($product->image_url) && $product->variants->isNotEmpty()) {
                    $firstVariantWithImage = $product->variants->firstWhere('image_url', '!=', null);
                    if ($firstVariantWithImage) {
                        $product->image_url = $firstVariantWithImage->image_url;
                    }
                }

                $matchingVariants = $product->variants->filter(function ($variant) use ($query) {
                    return stripos($variant->title, $query) !== false;
                })->values();

                $searchMatches = [];
                $matchingCategory = null;
                $matchingParentCategory = null;

                if (stripos($product->name, $query) !== false) {
                    $searchMatches[] = 'product_name';
                }

                if (!empty($product->description) && stripos($product->description, $query) !== false) {
                    $searchMatches[] = 'product_description';
                }

                if ($product->category && stripos($product->category->name, $query) !== false) {
                    $searchMatches[] = 'category';
                    $matchingCategory = $product->category->name;
                }
                if (
                    $product->category && $product->category->parent &&
                    stripos($product->category->parent->name, $query) !== false
                ) {
                    $searchMatches[] = 'parent_category';
                    $matchingParentCategory = $product->category->parent->name;
                }

                if ($matchingVariants->isNotEmpty()) {
                    $searchMatches[] = 'variant';
                }

                $productArray = $product->toArray();
                $productArray['matching_variants'] = $matchingVariants->toArray();
                $productArray['search_matches'] = $searchMatches;

                if ($matchingCategory) {
                    $productArray['matching_category'] = $matchingCategory;
                }

                if ($matchingParentCategory) {
                    $productArray['matching_parent_category'] = $matchingParentCategory;
                }

                return $productArray;
            });

            return response()->json([
                'res' => 'success',
                'message' => 'Search completed successfully.',
                'data' => [
                    'products' => $products,
                    'pagination' => [
                        'current_page' => $page,
                        'total_count' => $totalCount,
                        'per_page' => $limit,
                        'total_pages' => ceil($totalCount / $limit),
                        'has_more' => ($page * $limit) < $totalCount,
                    ],
                    'search_info' => [
                        'query' => $query,
                        'category_id' => $categoryId,
                        'brand_id' => $brandId,
                        'results_count' => $products->count(),
                    ]
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'res' => 'error',
                'message' => 'Search failed.',
                'errors' => [$e->getMessage()],
            ], 500);
        }
    }

    public function getMostOrderedProducts(Request $request)
    {
        try {
            $limit = $request->query('limit', 10);
            $limit = max(1, min(50, (int)$limit));

            $filterByStatus = $request->query('filter_status', false);

            $products = Product::with([
                'category:id,name',
                'brand:id,name',
                'variants' => function ($query) {
                    $query->select('id', 'product_id', 'title', 'sku', 'sp', 'mrp', 'stock', 'image_url', 'image_json')
                        ->orderBy('sp', 'asc');
                }
            ])
                ->select('products.*')
                ->selectSub(function ($query) use ($filterByStatus) {
                    $subQuery = $query->selectRaw('COALESCE(SUM(order_items.quantity), 0)')
                        ->from('order_items')
                        ->whereColumn('order_items.product_id', 'products.id');

                    if ($filterByStatus) {
                        $subQuery->join('orders', 'orders.id', '=', 'order_items.order_id')
                            ->whereIn('orders.status', ['confirmed', 'processing', 'shipped', 'delivered']);
                    }

                    return $subQuery;
                }, 'total_ordered_quantity')
                ->selectSub(function ($query) use ($filterByStatus) {
                    $subQuery = $query->selectRaw('COUNT(DISTINCT order_items.order_id)')
                        ->from('order_items')
                        ->whereColumn('order_items.product_id', 'products.id');

                    if ($filterByStatus) {
                        $subQuery->join('orders', 'orders.id', '=', 'order_items.order_id')
                            ->whereIn('orders.status', ['confirmed', 'processing', 'shipped', 'delivered']);
                    }

                    return $subQuery;
                }, 'total_orders_count')
                ->selectSub(function ($query) use ($filterByStatus) {
                    $subQuery = $query->selectRaw('COALESCE(SUM(order_items.total), 0)')
                        ->from('order_items')
                        ->whereColumn('order_items.product_id', 'products.id');

                    if ($filterByStatus) {
                        $subQuery->join('orders', 'orders.id', '=', 'order_items.order_id')
                            ->whereIn('orders.status', ['confirmed', 'processing', 'shipped', 'delivered']);
                    }

                    return $subQuery;
                }, 'total_revenue')
                ->withCount('likes')
                ->active()
                ->having('total_ordered_quantity', '>', 0)
                ->orderBy('total_ordered_quantity', 'desc')
                ->limit($limit)
                ->get()
                ->each(function ($product) {
                    $product->append(['average_rating', 'reviews_count']);
                })
                ->map(function ($product) {
                    $prices = $product->variants->pluck('sp')->filter()->values();
                    $minPrice = $prices->min() ?: 0;
                    $maxPrice = $prices->max() ?: 0;

                    $totalStock = $product->variants->sum('stock');

                    $bestVariant = $product->variants->sortBy('sp')->first();

                    $imageUrl = $product->image_url ?: ($bestVariant ? $bestVariant->image_url : null);

                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'description' => $product->description,
                        'image_url' => $imageUrl,
                        'category' => $product->category ? [
                            'id' => $product->category->id,
                            'name' => $product->category->name,
                        ] : null,
                        'brand' => $product->brand ? [
                            'id' => $product->brand->id,
                            'name' => $product->brand->name,
                        ] : null,
                        'price_range' => [
                            'min' => $minPrice,
                            'max' => $maxPrice,
                            'currency' => 'INR'
                        ],
                        'total_stock' => $totalStock,
                        'likes_count' => $product->likes_count,
                        'variants_count' => $product->variants->count(),
                        'best_variant' => $bestVariant ? [
                            'id' => $bestVariant->id,
                            'title' => $bestVariant->title,
                            'sku' => $bestVariant->sku,
                            'sp' => $bestVariant->sp,
                            'mrp' => $bestVariant->mrp,
                            'stock' => $bestVariant->stock,
                            'image_url' => $bestVariant->image_url,
                        ] : null,
                        'total_ordered_quantity' => (int)$product->total_ordered_quantity,
                        'total_orders_count' => (int)$product->total_orders_count,
                        'total_revenue' => (float)$product->total_revenue,
                        'average_rating' => $product->average_rating,
                        'reviews_count' => $product->reviews_count,
                        'created_at' => $product->created_at,
                    ];
                });

            return response()->json([
                'res' => 'success',
                'message' => 'Most ordered products fetched successfully.',
                'data' => [
                    'products' => $products,
                    'count' => $products->count(),
                    'limit' => $limit,
                    'analytics' => [
                        'total_units_sold' => $products->sum('total_ordered_quantity'),
                        'total_revenue' => $products->sum('total_revenue'),
                        'total_orders' => $products->sum('total_orders_count'),
                        'average_rating' => $products->avg('average_rating') ?: 0,
                    ]
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'res' => 'error',
                'message' => 'Failed to fetch most ordered products.',
                'errors' => [$e->getMessage()],
            ], 500);
        }
    }

    public function getTopSellingProducts(Request $request)
    {
        try {
            $limit = $request->query('limit', 10);
            $limit = max(1, min(50, (int)$limit));

            $products = Product::with([
                'category:id,name',
                'brand:id,name',
                'variants' => function ($query) {
                    $query->select('id', 'product_id', 'title', 'sku', 'sp', 'mrp', 'stock', 'image_url')
                        ->orderBy('sp', 'asc');
                }
            ])
                ->withCount('likes')
                ->select('id', 'name', 'description', 'image_url', 'category_id', 'brand_id', 'created_at')
                ->active()
                ->orderBy('likes_count', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($product) {
                    $prices = $product->variants->pluck('sp')->filter()->values();
                    $minPrice = $prices->min() ?: 0;
                    $maxPrice = $prices->max() ?: 0;

                    $totalStock = $product->variants->sum('stock');

                    $bestVariant = $product->variants->sortBy('sp')->first();

                    $imageUrl = $product->image_url ?: ($bestVariant ? $bestVariant->image_url : null);

                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'description' => $product->description,
                        'image_url' => $imageUrl,
                        'category' => $product->category ? [
                            'id' => $product->category->id,
                            'name' => $product->category->name,
                        ] : null,
                        'brand' => $product->brand ? [
                            'id' => $product->brand->id,
                            'name' => $product->brand->name,
                        ] : null,
                        'price_range' => [
                            'min' => $minPrice,
                            'max' => $maxPrice,
                            'currency' => 'INR'
                        ],
                        'total_stock' => $totalStock,
                        'likes_count' => $product->likes_count,
                        'variants_count' => $product->variants->count(),
                        'best_variant' => $bestVariant ? [
                            'id' => $bestVariant->id,
                            'title' => $bestVariant->title,
                            'sku' => $bestVariant->sku,
                            'sp' => $bestVariant->sp,
                            'mrp' => $bestVariant->mrp,
                            'stock' => $bestVariant->stock,
                            'image_url' => $bestVariant->image_url,
                        ] : null,
                        'created_at' => $product->created_at,
                    ];
                });

            return response()->json([
                'res' => 'success',
                'message' => 'Top selling products fetched successfully.',
                'data' => [
                    'products' => $products,
                    'count' => $products->count(),
                    'limit' => $limit,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'res' => 'error',
                'message' => 'Failed to fetch top selling products.',
                'errors' => [$e->getMessage()],
            ], 500);
        }
    }

    public function debugOrderData()
    {
        try {
            $productsCount = Product::count();
            $ordersCount = DB::table('orders')->count();
            $orderItemsCount = DB::table('order_items')->count();

            $orderStatuses = DB::table('orders')->select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->get();

            $sampleOrderItems = DB::table('order_items')
                ->join('products', 'products.id', '=', 'order_items.product_id')
                ->select('order_items.*', 'products.name as product_name')
                ->limit(10)
                ->get();

            $productsWithOrders = DB::table('products')
                ->leftJoin('order_items', 'products.id', '=', 'order_items.product_id')
                ->select('products.id', 'products.name', DB::raw('COUNT(order_items.id) as order_items_count'), DB::raw('SUM(order_items.quantity) as total_quantity'))
                ->groupBy('products.id', 'products.name')
                ->having('order_items_count', '>', 0)
                ->get();

            return response()->json([
                'res' => 'success',
                'debug_data' => [
                    'counts' => [
                        'products' => $productsCount,
                        'orders' => $ordersCount,
                        'order_items' => $orderItemsCount,
                    ],
                    'order_statuses' => $orderStatuses,
                    'sample_order_items' => $sampleOrderItems,
                    'products_with_orders' => $productsWithOrders,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'res' => 'error',
                'message' => 'Debug failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
