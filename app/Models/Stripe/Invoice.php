<?php

namespace App\Models\Stripe;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'stripe_invoices';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'stripe_id',
        'stripe_customer_id',
        'stripe_price_id',
        'stripe_subscription_id',

        'url',
        'pdf',

        'status',
        'currency',
        'amount',

        'stripe_created_at',
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
}
