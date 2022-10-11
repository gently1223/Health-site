<?php

namespace App\Transformers\Club;

use Carbon\Carbon;
use League\Fractal\TransformerAbstract;

/**
 * Class CheckinsTransformer.
 *
 * @package namespace App\Transformers\Company;
 */
class PayoutCustomerTransformer extends TransformerAbstract
{
    /**
     * Transform the checkins.
     *
     * @param \Stripe\Account $account        [Stripe account instance]
     * @param string|null     $payoutMethodId [Preferable payout method id]
     *
     * @return array
     */
    public function transform($account, $payoutMethodId = null)
    {
        $paymentMethods = [];

        foreach ($account->external_accounts as $paymentMethod) {
            $paymentMethods[] = (object) [
                'id'         => $paymentMethod->id,
                'type'       => $paymentMethod->object,
                'preferable' => $paymentMethod->id == $payoutMethodId,
                'detailed' => $paymentMethod->object == 'card' ? (object) [
                    'brand' => $paymentMethod->brand,
                    'last4' => $paymentMethod->last4,
                ] : (object) [
                    'bank_name'      => $paymentMethod->bank_name,
                    'routing_number' => $paymentMethod->routing_number,
                    'last4'          => $paymentMethod->last4,
                ],
            ];
        }

        return (object) [
            'id'              => $account->id,
            'name'            => $account->business_name,
            'payment_methods' => $paymentMethods,
        ];
    }
}
