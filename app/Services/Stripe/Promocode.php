<?php

namespace App\Services\Stripe;

use Stripe\StripeClient;
use App\Models\Stripe\Product;

class Promocode
{
    /**
     * Stripe instance
     * @return \Stripe\Stripe|null
     */
    private $stripe = null;

    /**
     * Promocode Stripe instance
     * @return object|null
     */
    private $promocode = null;

    /**
     * Instantiate a new Payout instance.
     * @var \App\Models\Company\Location|null  $location [company location]
     */
    public function __construct()
    {
        $this->stripe = new StripeClient(config('stripe.secret_key'));
    }

    /**
     * Get Promocode
     * @var string $promocode
     * @return array
     */
    public function get($promocode)
    {
        try {
            $this->promocode = $this->stripe->coupons->retrieve($promocode, []);
        } catch (\Exception $e) {

        }

        return $this;
    }

    /**
     * Format
     * @return array
     */
    public function getRegistrationFeesDiscounted()
    {
        $isValid  = false;
        $discount = [
            'percentage' => 0,
            'amount'     => 0,
        ];

        if ($this->promocode && $this->promocode->valid) {
            if ($this->promocode->percent_off > 0) {
                $discount['percentage'] = $this->promocode->percent_off;
            } else {
                $discount['amount'] = $this->promocode->amount_off;
            }

            $isValid = true;
        }

        $products = Product::getRegistrationFees($discount);

        return [
            'success'  => $isValid,
            'products' => $products,
        ];
    }
}
