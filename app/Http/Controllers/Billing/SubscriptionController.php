<?php

namespace App\Http\Controllers\Billing;

use Carbon\Carbon;
use App\Models\Stripe\Product;
use App\Models\Stripe\Invoice;
use App\Services\Stripe\Payout;

class SubscriptionController extends \App\Http\Controllers\Controller
{
    /**
     * Show the billing subscription page.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $subscription = auth()->user()->company->active_subscription;

        return view('dashboard.billing.subscription', [
            'subscription' => $subscription,
        ]);
    }

    /**
     * Show the billing invoices page.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function invoices()
    {
        $parentLocation = auth()->user()->getParentLocation();

        $invoices = collect([]);
        if ($parentLocation->stripe_customer_id) {
            $invoices = Invoice::where('stripe_customer_id', $parentLocation->stripe_customer_id)
                               ->with('price', 'price.product')
                               ->latest()
                               ->get();
        }

        return view('dashboard.billing.invoices', [
            'invoices' => $invoices,
        ]);
    }

    /**
     * Card.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function card()
    {
        $location = auth()->user()->location;

        $stripeCard = null;
        if ($location->stripe_customer_id) {
            $stripe = new \Stripe\StripeClient(config('stripe.secret_key'));

            $stripeCustomer = $stripe->customers->retrieve($location->stripe_customer_id, []);
            if ($stripeCustomer->default_source) {
                $stripeCard = $stripe->customers->retrieveSource($location->stripe_customer_id, $stripeCustomer->default_source, []);
            }
        }

        $products          = collect([]);
        $isRegisterFeePaid = auth()->user()->isRegisterFeePaid();
        if (!$isRegisterFeePaid) {
            $products = Product::getRegistrationFees();
        }

        if (auth()->user()->location->payout_method && !auth()->user()->location->payout_method->stripe_payout_method_id) {
            (new Payout(auth()->user()->location))->setDefaultPayoutMethod();
        }

        $payout = new Payout($location);

        return view('dashboard.billing.card', [
            'stripeAccount' => $payout->getLocationPayoutData(),
            'card'          => $stripeCard,
            'feePaid'       => $isRegisterFeePaid,
            'products'      => $products,
        ]);
    }

    /**
     * Change Card.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function changeCard()
    {
        $company  = auth()->user()->company;
        $location = auth()->user()->location;

        if ($company && $location) {
            $stripe = new \Stripe\StripeClient(config('stripe.secret_key'));

            $number   = request()->get('card_number');
            $expMonth = request()->get('card_valid_month');
            $expYear  = request()->get('card_valid_year');
            $cvc      = request()->get('cvc');

            try {
                $token = $stripe->tokens->create([
                    'card' => [
                        'number'    => $number,
                        'exp_month' => $expMonth,
                        'exp_year'  => $expYear,
                        'cvc'       => $cvc,
                    ],
                ]);

                if (!$location->stripe_customer_id) {
                    /* Create Stripe Customer */
                    $stripeCustomer = $stripe->customers->create([
                        'name'   => $company->name,
                        'email'  => auth()->user()->email,
                        'source' => $token->id,
                    ]);

                    $location->stripe_customer_id = $stripeCustomer->id;
                    $location->save();
                } else {
                    $stripeCustomer = $stripe->customers->retrieve($location->stripe_customer_id, []);

                    $stripeCard = $stripe->customers->createSource($location->stripe_customer_id, ['source' => $token->id]);
                    $stripe->customers->update($location->stripe_customer_id, [
                        'default_source' => $stripeCard->id
                    ]);
                }
            } catch (\Stripe\Exception\ExceptionInterface $e) {
                return redirect()->back()->with('errorMessage', $e->getMessage());
            }
        }

        return redirect(route('billing.card'))->with('successMessage', 'Card info successfully updated.');
    }

    /**
     * Pay Register fee.
     *
     * @param integer $productId
     * @param integer $priceId
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function pay($productId, $priceId)
    {
        $location = auth()->user()->location;

        try {
            /* Get Stripe Customer */
            $stripe   = new \Stripe\StripeClient(config('stripe.secret_key'));
            $customer = $stripe->customers->retrieve($location->stripe_customer_id, []);

            $product = Product::where('id', $productId)->first();
            if ($product) {
                $price = $product->prices->where('id', $priceId)->first();

                if ($price) {
                    /* Create invoice item and connect product price to it */
                    $invoiceItem = $stripe->invoiceItems->create([
                        'customer' => $customer->id,
                        'price'    => $price->stripe_id,
                    ]);

                    $invoiceData = [
                        'customer' => $customer->id,
                    ];

                    if (request()->get('promocode')) {
                        $coupon = null;
                        try {
                            $coupon = $stripe->coupons->retrieve(request()->get('promocode'), []);
                        } catch (\Exception $e) {
                            /* ignore no coupon error */
                        }

                        if ($coupon) {
                            $invoiceData['discounts'] = [
                                [
                                    'coupon' => $coupon->id,
                                ],
                            ];
                        }
                    }

                    $invoice = $stripe->invoices->create($invoiceData);

                    $paid = $stripe->invoices->pay($invoice->id, []);

                    if ($paid->paid) {
                        $location->is_register_fee_purchased = true;
                        $location->save();
                    }

                    Invoice::create([
                        'stripe_id'          => $invoice->id,
                        'stripe_customer_id' => $customer->id,
                        'stripe_price_id'    => $price->stripe_id,

                        'url'                => $paid->hosted_invoice_url,
                        'pdf'                => $paid->invoice_pdf,

                        'status'             => $paid->status,
                        'currency'           => $price->currency,
                        'amount'             => $paid->amount_paid,

                        'stripe_created_at'  => Carbon::parse($invoice->created)->format('Y-m-d H:i:s'),
                    ]);

                    return redirect(route('billing.card'))->with('successMessage', 'Product successfully purchased.');
                }
            }
        } catch (\Stripe\Exception\ExceptionInterface $e) {
            return redirect()->back()->with('errorMessage', $e->getMessage());
        }

        return redirect()->back()->with('errorMessage', 'Oops... Something went wrong.');
    }
}
