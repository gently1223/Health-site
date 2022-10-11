<?php

namespace App\Models\Stripe;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'stripe_products';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'stripe_id',
        'name',
        'description',
        'stripe_created_at',
        'stripe_updated_at',
        'is_for_register',
        'is_deleted_on_stripe_side',
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = [
        'stripe_created_at',
        'stripe_updated_at',

        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Get the prices for the product.
     */
    public function prices()
    {
        return $this->hasMany('App\Models\Stripe\Price', 'stripe_product_id', 'stripe_id')
                    ->orderBy('stripe_created_at', 'DESC');
    }

    /**
     * Get Product Allowed for registration.
     *
     * @return string
     */
    public function getIsAllowedForRegistrationAttribute()
    {
        return $this->prices->where('type', 'one_time')->first() ? true : false;
    }

    /**
     * Get Product Prices formatted.
     *
     * @return string
     */
    public function getPricesFormattedAttribute()
    {
        $prices = [];
        foreach ($this->prices as $price) {
            if (!$price->is_deleted_on_stripe_side) {
                $prices[] = $price->currency_symbol.($price->amount / 100);
            }
        }

        return implode(', ', $prices);
    }

    /**
     * Fetch data from Stripe
     *
     */
    public static function fetchFromStripe()
    {
        $stripe = new \Stripe\StripeClient(config('stripe.secret_key'));

        $goods    = $stripe->products->all(['limit' => 100, 'type' => 'good']);
        $services = $stripe->products->all(['limit' => 100, 'type' => 'service']);

        self::fetchProcess($stripe, $goods);
        self::fetchProcess($stripe, $services);

        $activeProducts = [];
        foreach ($goods as $stripeProduct) {
            if ($stripeProduct->active) {
                $activeProducts[] = $stripeProduct->id;
            }
        }

        foreach ($services as $stripeProduct) {
            if ($stripeProduct->active) {
                $activeProducts[] = $stripeProduct->id;
            }
        }

        Product::withTrashed()
               ->whereNotIn('stripe_id', $activeProducts)
               ->update([
                   'is_deleted_on_stripe_side' => true,
                   'deleted_at'                => Carbon::now()->format('Y-m-d H:i:s'),
               ]);
    }

    /**
     * Process retrieved data
     *
     */
    private static function fetchProcess($stripe, $products)
    {
        foreach ($products as $stripeProduct) {
            $product = Product::withTrashed()
                              ->firstOrNew([
                                  'stripe_id' => $stripeProduct->id,
                              ]);

            $product->name                      = $stripeProduct->name;
            $product->description               = $stripeProduct->description ?? '';
            $product->stripe_created_at         = Carbon::parse($stripeProduct->created)->format('Y-m-d H:i:s');
            $product->stripe_updated_at         = Carbon::parse($stripeProduct->updated)->format('Y-m-d H:i:s');
            $product->is_deleted_on_stripe_side = $stripeProduct->active ? false : true;
            $product->save();

            $prices = $stripe->prices->all([
                'product' => $product->stripe_id,
            ]);

            $activePrices = [];
            foreach ($prices as $stripePrice) {
                $price = Price::withTrashed()
                              ->firstOrNew([
                                  'stripe_id' => $stripePrice->id,
                              ]);

                $price->stripe_product_id         = $stripePrice->product;
                $price->type                      = $stripePrice->type;
                $price->interval                  = $stripePrice->recurring->interval ?? null;
                $price->interval_count            = $stripePrice->recurring->interval_count ?? null;
                $price->trial_period_days         = $stripePrice->recurring->trial_period_days ?? null;
                $price->currency                  = $stripePrice->currency;
                $price->amount                    = $stripePrice->unit_amount;
                $price->name                      = $stripePrice->nickname ?? '';
                $price->stripe_created_at         = Carbon::parse($stripePrice->created)->format('Y-m-d H:i:s');
                $price->is_deleted_on_stripe_side = $stripePrice->active ? false : true;
                $price->save();

                if ($stripePrice->active) {
                    $activePrices[] = $stripePrice->id;
                }
            }

            Price::withTrashed()
                 ->where('stripe_product_id', $stripeProduct->id)
                 ->whereNotIn('stripe_id', $activePrices)
                 ->update([
                     'is_deleted_on_stripe_side' => true,
                     'deleted_at'                => Carbon::now()->format('Y-m-d H:i:s'),
                 ]);
        }
    }

    /**
     * Get Registration fees
     * @param array|null $discount [discount fee]
     */
    public static function getRegistrationFees($discount = null)
    {
        return self::with('prices')->where('is_for_register', true)->get()->map(function($item) use ($discount) {
            $prices = $item->prices->map(function($price) use ($discount) {
                $priceAmount = $price->amount;

                if ($discount) {
                    if (isset($discount['percentage']) && $discount['percentage'] > 0) {
                        $priceAmount = $priceAmount - (($priceAmount / 100) * $discount['percentage']);
                    }

                    if (isset($discount['amount']) && $discount['amount'] > 0) {
                        $priceAmount = $priceAmount - $discount['amount'];
                    }

                    if ($priceAmount < 0) {
                        $priceAmount = 0;
                    }
                }

                return (object)[
                    'id'                 => $price->id,
                    'name'               => $price->name,
                    'price'              => $price->currency_symbol.number_format($priceAmount / 100, 2),
                    'is_subscription'    => $price->isSubscription(),
                    'interval_formatted' => $price->interval_formatted,
                ];
            });

            return (object) [
                'id'          => $item->id,
                'name'        => $item->name,
                'description' => $item->description,
                'prices'      => $prices,
            ];
        });
    }
}
