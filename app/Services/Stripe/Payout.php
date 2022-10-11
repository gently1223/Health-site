<?php

namespace App\Services\Stripe;

use Stripe\StripeClient;
use App\Models\Stripe\StripePayoutCustomer;
use App\Transformers\Club\PayoutCustomerTransformer;
use App\Transformers\Stripe\TransfersTransformer;

class Payout
{
    /**
     * Stripe instance
     * @return \Stripe\Stripe|null
     */
    private $stripe = null;

    /**
     * Location Account instance
     * @return \App\Models\Stripe\StripePayoutCustomer|null
     */
    private $account = null;

    /**
     * Instantiate a new Payout instance.
     * @var \App\Models\Company\Location|null  $location [company location]
     */
    public function __construct($location = null)
    {
        $this->setAccount($location);
        $this->stripe = new StripeClient(config('stripe.secret_key'));
    }

    /**
     * Account setter
     *
     * @var \App\Models\Company\Location|null  $location [company location]
     * @return void
     */
    public function setAccount($location)
    {
        if ($location) {
            $this->account = StripePayoutCustomer::where('location_id', $location->id)->first();
        }
    }

    /**
     * Send payout to external account
     *
     * @var integer $amount   [amount]
     * @var string  $currency [payout currency (usd as default)]
     * @return array
     */
    public function payout($amount, $currency = 'usd')
    {
        $stripeAccount = null;
        if ($this->account) {
            $stripeAccount = $this->stripe->accounts->retrieve($this->account->stripe_customer_id, []);

            $payoutMethod = $this->account->confirmDefaultPayoutMethod($stripeAccount);

            if ($payoutMethod->id) {
                $response = $this->stripe->transfers->create([
                    'amount'      => $amount,
                    'currency'    => $currency,
                    'destination' => $this->account->stripe_customer_id,
                ]);

                return [
                    'success'  => true,
                    'response' => $response,
                ];
            }
        }

        return [
            'success' => false,
            'message' => 'No default payout method specified',
        ];
    }

    /**
     * Get location paout settings data
     *
     * @return \App\Transformers\Club\PayoutCustomerTransformer|null
     */
    public function getLocationPayoutData()
    {
        $stripeAccount = null;
        if ($this->account) {
            $stripeAccount = $this->stripe->accounts->retrieve($this->account->stripe_customer_id, []);

            if ($stripeAccount) {
                $stripeAccount = (new PayoutCustomerTransformer())->transform($stripeAccount, $this->account->stripe_payout_method_id);
            }
        }

        return $stripeAccount;
    }

    /**
     * Redirect to account link
     *
     * @return string [url to stripe]
     */
    public function redirectToAccountLink()
    {
        if (!$this->account) {
            $account = $this->stripe->accounts->create([
                'country' => 'US',
                'type'    => 'express',
            ]);

            $accountId = $account->id;

            StripePayoutCustomer::create([
                'user_id'            => auth()->user()->id,
                'location_id'        => auth()->user()->location->id,
                'company_id'         => auth()->user()->company->id,
                'stripe_customer_id' => $accountId,
            ]);
        } else {
            $accountId = $this->account->stripe_customer_id;
        }

        $link = $this->stripe->accountLinks->create([
            'account'     => $accountId,
            'refresh_url' => route('billing.account'),
            'return_url'  => route('billing.account'),
            'type'        => 'account_onboarding',
        ]);

        return $link->url;
    }

    /**
     * Set default payout method
     *
     * @var string $payoutMethodId [stripe payout method id]
     * @return \App\Transformers\Club\PayoutCustomerTransformer|null
     */
    public function setDefaultPayoutMethod($payoutMethodId = null)
    {
        $stripeAccount = null;
        if ($this->account) {
            $stripeAccount = $this->stripe->accounts->retrieve($this->account->stripe_customer_id, []);

            $this->account->confirmDefaultPayoutMethod($stripeAccount, $payoutMethodId);

            if ($stripeAccount) {
                $stripeAccount = (new PayoutCustomerTransformer())->transform($stripeAccount, $this->account->stripe_payout_method_id);
            }
        }

        return $stripeAccount;
    }

    /**
     * Get transfer history
     *
     * @var    integer|null $limit [limit of transfers]
     * @return array
     */
    public function getTransfersHistory($limit = null)
    {
        $stripeAccount = null;
        if ($this->account) {
            $params = [
                'destination' => $this->account->stripe_customer_id,
            ];

            if ($limit) {
                $params['limit'] = $limit;
            }

            $transfers = $this->stripe->transfers->all($params);

            return (new TransfersTransformer())->transform($transfers->data);
        }

        return [];
    }
}
