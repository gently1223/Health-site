<?php

namespace App\Transformers\Stripe;

use Carbon\Carbon;
use League\Fractal\TransformerAbstract;

/**
 * Class EmployeesTransformer.
 *
 * @package namespace App\Transformers\Company;
 */
class TransfersTransformer extends TransformerAbstract
{
    protected $currencies = [
        'usd' => '$',
    ];

    /**
     * Transform the transfers list.
     *
     * @param array $data [stripe transfers list]
     *
     * @return array
     */
    public function transform($data = [])
    {
        $return = [];


        foreach ($data as $transfer) {
            $return[] = (object) [
                'id'             => substr($transfer->id, -6),
                'payment_id'     => $transfer->destination_payment,
                'amount'         => $transfer->amount,
                'desc'           => $transfer->description,
                'amountFormated' => $this->getAmountFormatted($transfer->amount, $transfer->currency),
                'status'         => strtoupper($transfer->reversed ? "reversed" : "Paid"),
                'date'           => Carbon::parse($transfer->created)->format('M d Y g:i a'),
            ];
        }

        return $return;
    }

    /**
     * Format transfer amount.
     *
     * @param integer $amount   [transfer amount]
     * @param string  $currency [transfer currency]
     *
     * @return array
     */
    private function getAmountFormatted($amount, $currency)
    {
        $currencySymbol = '';

        if (isset($this->currencies[$currency])) {
            $currencySymbol = $this->currencies[$currency];
        }
        return $currencySymbol.number_format($amount/100, 2, '.', ' ');
    }
}
