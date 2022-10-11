<?php

namespace App\Models\Stripe;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Price extends Model
{
    use SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'stripe_product_prices';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'stripe_id',
        'stripe_product_id',
        'type',
        'interval',
        'interval_count',
        'trial_period_days',
        'currency',
        'amount',
        'name',
        'stripe_created_at',
        'is_deleted_on_stripe_side',
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = [
        'stripe_created_at',

        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Get price product.
     */
    public function product()
    {
        return $this->hasOne('App\Models\Stripe\Product', 'stripe_id', 'stripe_product_id');
    }

    /**
     * Get currency symbol.
     *
     * @return string
     */
    public function getCurrencySymbolAttribute()
    {
        $symbols = [
            'usd' => '$',
        ];

        return $symbols[$this->currency] ?? '';
    }

    /**
     * Get interval formatted.
     *
     * @return string
     */
    public function getIntervalFormattedAttribute()
    {
        if ($this->isSubscription()) {
            $interval = $this->interval;
            $count = $this->interval_count;

            if ($count == 1) {
                return $interval == 'month' ? 'Monthly' : 'Yearly';
            } else {
                return 'per '.$this->interval_count.' '.($interval == 'month' ? 'Months' : 'Years');
            }
        }

        return '';
    }

    /**
     * Get currency symbol.
     *
     * @return string
     */
    public function isSubscription()
    {
        return $this->type == 'recurring' ? true : false;
    }
}
