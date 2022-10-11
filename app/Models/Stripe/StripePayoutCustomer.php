<?php

namespace App\Models\Stripe;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StripePayoutCustomer extends Model
{
    use SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'stripe_payout_customers';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'company_id',
        'location_id',
        'user_id',
        'stripe_customer_id',
        'stripe_payout_method_id',
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Confirm default payout method.
     *
     * @param  \Stripe\Account $stripeAccount  [Stripe account instance]
     * @param  string|null     $payoutMethodId [Preferable payout method id]
     * @return object
     */
    public function confirmDefaultPayoutMethod($stripeAccount, $payoutMethodId = null)
    {
        $preferablePayoutMethodType = null;
        $setPreferablePayoutMethod  = null;

        // Try to change preferable payout method id
        if ($payoutMethodId) {
            foreach ($stripeAccount->external_accounts->data as $externalAccount) {
                if ($externalAccount->id == $payoutMethodId) {
                    $setPreferablePayoutMethod  = $payoutMethodId;
                    $preferablePayoutMethodType = $externalAccount->object;
                }
            }
        }

        // If no $payoutMethodId param set we need to check current payout method and validate it
        if (!$setPreferablePayoutMethod && $this->stripe_payout_method_id) {
            foreach ($stripeAccount->external_accounts->data as $externalAccount) {
                if ($externalAccount->id == $this->stripe_payout_method_id) {
                    $setPreferablePayoutMethod  = $this->stripe_payout_method_id;
                    $preferablePayoutMethodType = $externalAccount->object;
                }
            }
        }

        // If still no valid default payout method we need to set first method as preferable
        if (!$setPreferablePayoutMethod) {
            $method = collect($stripeAccount->external_accounts->data)->first();

            if ($method) {
                $setPreferablePayoutMethod = $method->id;
            }
        }

        if ($setPreferablePayoutMethod && $this->stripe_payout_method_id != $setPreferablePayoutMethod) {
            $this->stripe_payout_method_id = $setPreferablePayoutMethod;
            $this->save();
        }

        return (object) [
            'id'   => $setPreferablePayoutMethod,
            'type' => $preferablePayoutMethodType,
        ];
    }
}
