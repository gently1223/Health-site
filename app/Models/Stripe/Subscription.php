<?php

namespace App\Models\Stripe;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subscription extends Model
{
    use SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'stripe_subscriptions';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'stripe_id',
        'stripe_customer_id',
        'stripe_price_id',
        'status',

        'stripe_trial_start_at',
        'stripe_trial_end_at',

        'stripe_start_at',
        'stripe_period_start_at',
        'stripe_period_end_at',

        'stripe_created_at',
        'stripe_cancelled_at',
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = [
        'stripe_trial_start_at',
        'stripe_trial_end_at',

        'stripe_start_at',
        'stripe_period_start_at',
        'stripe_period_end_at',

        'stripe_created_at',
        'stripe_cancelled_at',

        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Get subscription price.
     */
    public function price()
    {
        return $this->hasOne('App\Models\Stripe\Price', 'stripe_id', 'stripe_price_id');
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
