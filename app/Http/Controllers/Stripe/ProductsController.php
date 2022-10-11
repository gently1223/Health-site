<?php

namespace App\Http\Controllers\Stripe;

use App\Models\Stripe\Product;

class ProductsController extends \App\Http\Controllers\Controller
{

    /**
     * Fetch products from Stripe
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function fetch()
    {
        Product::fetchFromStripe();

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Show products list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $products = Product::orderBy('stripe_created_at', 'DESC')
                           ->with('prices')
                           ->where('is_for_register', false)
                           ->get();

        $register = Product::orderBy('stripe_created_at', 'DESC')
                           ->with('prices')
                           ->where('is_for_register', true)
                           ->get();

        return view('dashboard.root.products.index', [
            'is_archive' => false,
            'products'   => $products,
            'register'   => $register,
        ]);
    }

    /**
     * Show products archive
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function archive()
    {
        $products = Product::orderBy('stripe_created_at', 'DESC')
                           ->onlyTrashed()
                           ->with('prices')
                           ->get();

        return view('dashboard.root.products.index', [
            'is_archive' => true,
            'products'   => $products,
        ]);
    }

    /**
     * Remove Product
     *
     */
    public function remove($productId)
    {
        $product = Product::where('id', $productId)->first();

        if (!$product) {
            return abort(404);
        }

        $product->delete();

        return redirect(route('root.products'));
    }

    /**
     * Restore Product
     *
     */
    public function restore($productId)
    {
        $product = Product::where('id', $productId)->onlyTrashed()->first();

        if (!$product) {
            return abort(404);
        }

        $product->restore();

        return redirect(route('root.products'));
    }

    /**
     * Set Product as registration option
     *
     */
    public function setAsRegisterOption($productId)
    {
        $product = Product::where('id', $productId)->first();

        if (!$product && !$product->is_allowed_for_registration) {
            return abort(404);
        }

        $product->is_for_register = true;
        $product->save();

        return redirect(route('root.products'));
    }

    /**
     * Remove Product from registration options
     *
     */
    public function removeFromRegisterOptions($productId)
    {
        $product = Product::where('id', $productId)->first();

        if (!$product && !$product->is_allowed_for_registration) {
            return abort(404);
        }

        $product->is_for_register = false;
        $product->save();

        return redirect(route('root.products'));
    }

    /**
     * Show product prices list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function prices($productId)
    {
        $product = Product::where('id', $productId)->first();

        if (!$product) {
            return abort(404);
        }

        $prices = $product->prices;

        return view('dashboard.root.products.prices', [
            'is_archive' => false,
            'product'    => $product,
            'prices'     => $prices,
        ]);
    }

    /**
     * Show product prices archive list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function pricesArchive($productId)
    {
        $product = Product::where('id', $productId)->first();

        if (!$product) {
            return abort(404);
        }

        $prices = $product->prices()
                          ->onlyTrashed()
                          ->orderBy('stripe_created_at', 'DESC')
                          ->get();

        return view('dashboard.root.products.prices', [
            'is_archive' => true,
            'product'    => $product,
            'prices'     => $prices,
        ]);
    }

    /**
     * Remove Product Price
     *
     */
    public function removePrice($productId, $priceId)
    {
        $product = Product::where('id', $productId)->first();

        if (!$product) {
            return abort(404);
        }

        $price = $product->prices->where('id', $priceId)->first();

        if (!$price) {
            return abort(404);
        }

        $price->delete();

        return redirect(route('root.products.prices', ['productId' => $product->id]));
    }

    /**
     * Restore Product Price
     *
     */
    public function restorePrice($productId, $priceId)
    {
        $product = Product::where('id', $productId)->first();

        if (!$product) {
            return abort(404);
        }

        $price = $product->prices()->onlyTrashed()->where('id', $priceId)->first();

        if (!$price) {
            return abort(404);
        }

        $price->restore();

        return redirect(route('root.products.prices', ['productId' => $product->id]));
    }
}
