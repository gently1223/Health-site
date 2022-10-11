<?php

namespace App\Http\Controllers\Club;

use cURL;
use Carbon\Carbon;
use App\Models\Company\Location;
use App\Models\Company\Shipment;
use App\Models\Company\UsedCoupon;
use App\Models\Stripe\Product;
use App\Models\Stripe\Invoice;
use App\Transformers\Company\LocationsTransformer;
use Illuminate\Support\Facades\Validator;

class LocationsController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show locations list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $company = auth()->user()->company;

        $collection = collect([]);

        $parentLocation = auth()->user()->getParentLocation();

        if ($company) {
            $collection = Location::whereCompanyId($company->id)
                                  ->where(function($query) use ($parentLocation){
                                      $query->whereId($parentLocation->id)
                                            ->orWhere('parent_id', '=', $parentLocation->id);
                                  })
                                  ->orderBy('id', 'DESC')
                                  ->get();
        }

        $total = $collection->count();

        return view('dashboard.company.locations.index', [
            'enterpriseLocation' => false,
            'locations'          => $collection->slice(0, $this->perPage)->transformWith(new LocationsTransformer())->toArray(),
            'pages'              => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter locations list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $company = auth()->user()->company;

        $parentLocation = auth()->user()->getParentLocation();

        $locations = collect([]);
        if ($company) {
            $locations = Location::whereCompanyId($company->id)
                                 ->where(function($query) use ($parentLocation){
                                     $query->where('id', $parentLocation->id)
                                           ->orWhere('parent_id', $parentLocation->id);
                                 })
                                 ->orderBy('id', 'DESC')
                                 ->get();
        }

        if (request()->get('search')) {
            $locations = $locations->filter(function ($item) {
                return stristr($item->name, request()->get('search')) || stristr($item->state.' '.$item->city.' '.$item->address, request()->get('search')) || stristr($item->phone, request()->get('search'));
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $locations->count();

        return response()->json([
            'success' => true,
            'list'    => $locations->slice($page * $this->perPage, $this->perPage)->transformWith(new LocationsTransformer())->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show locations create page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        $parentLocation = auth()->user()->getParentLocation();

        $discount = [
            'percentage' => 0,
            'amount'     => 0,
        ];

        $usedCoupon = UsedCoupon::where('location_id', $parentLocation->id)->first();
        if ($usedCoupon) {
            $coupon = null;
            try {
                $stripe = new \Stripe\StripeClient(config('stripe.secret_key'));

                // $coupon = $stripe->coupons->retrieve('discount-2-amount', []);
                $coupon = $stripe->coupons->retrieve($usedCoupon->coupon, []);
            } catch (\Exception $e) {
                /* ignore no coupon error */
            }

            if ($coupon && $coupon->valid) {
                if ($coupon->percent_off > 0) {
                    $discount['percentage'] = $coupon->percent_off;
                } else {
                    $discount['amount'] = $coupon->amount_off;
                }
            }
        }

        $products = Product::getRegistrationFees($discount);

        return view('dashboard.company.locations.subcreate', [
            'products' => $products,
        ]);
    }

    /**
     * Show locations edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($locationId)
    {
        $company = auth()->user()->company;


        $location = Location::whereCompanyId($company->id)
                            // ->whereId(auth()->user()->location_id)
                            ->find($locationId);

        if (!$location) {
            return abort(404);
        }

        return view('dashboard.company.locations.manage', [
            'enterpriseLocation' => false,
            'location'           => $location,
        ]);
    }

    /**
     * Save location
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function save()
    {
        $company = auth()->user()->company;

        if (!$company) {
            return abort(404);
        }

        $locationId = request()->has('location_id') ? request()->get('location_id') : null;

        if (!$locationId) {
            $location = new Location();

             if ($company->id == 16 || $company->id == 27 || $company->id == 23 || $company->id == 35) {
                $location->amenities_required = true;
            }
        } else {
            $location = Location::whereCompanyId($company->id)
                                ->find($locationId);

            if (!$location) {
                return abort(404);
            }
        }

        $clubIdExists = Location::where('club_id', request()->get('club_id'))->where('id', '!=', $locationId)->first();
        if ($clubIdExists) {
            return redirect()->back()->withInput()->with('errorMessage', 'This Club ID is already have been taken.');
        }

        $veritap_id =  dechex( microtime(true) * 1000 ) . bin2hex( random_bytes(8) );

        $location->company_id  = $company->id;
        $location->club_id     = request()->get('club_id');
        $location->name        = request()->get('name');
        $location->state       = request()->get('state');
        $location->city        = request()->get('city');
        $location->postal      = request()->get('postal');
        $location->address     = request()->get('address');
        $location->phone       = request()->get('phone');
        $location->lat         = request()->get('lat');
        $location->lng         = request()->get('lng');
        // $location->veritap_id  = $veritap_id;
        $location->veritap_id  = $company->id;

        if (auth()->user()->hasRole('root')) {
            $location->franchise   = request()->get('franchise');
            $location->provisioned = request()->get('provisioned') ? 1 : 0;
        }

        $location->save();

        return redirect(route('club.locations'))->with('successMessage', 'Your updates have been saved');
    }

    /**
     * Swith to slave location.
     * @return \Illuminate\Http\RedirectResponse
     */
    protected function switch($locationId)
    {
        /* Get current user parent location */
        $parentLocation = auth()->user()->getParentLocation();

        $targetLocation = Location::where('id', $locationId)->first();

        if ($targetLocation && ($targetLocation->parent_id == $parentLocation->id || $targetLocation->id == $parentLocation->id)) {
            auth()->user()->location_id = $targetLocation->id;
            auth()->user()->save();

            return redirect(route('club.locations'))->with('successMessage', 'Successfully switched to '.$targetLocation->name);
        }

        return redirect(route('club.locations'))->with('errorMessage', 'You have no access to this location');
    }

    /**
     * Validate
     */
    public function validateSlave()
    {
        $errorStep = 0;
        $error     = false;

        /* Validate location */
        if (!$error) {
            $locationValidator = Validator::make(request()->all(), [
                'location_club_id' => 'required|string|max:255',
                'location_name'    => 'required|string|max:255',
                'location_city'    => 'required|string|max:255',
                'location_state'   => 'required|string|max:255',
                'location_postal'  => 'required|string|max:255',
                'location_address' => 'required|string|max:255',
            ]);

            if ($locationValidator->fails()) {
                $error     = $locationValidator->errors()->first();
                $errorStep = 0;
            }

            $search = request()->get('location_club_id');
            $validateLocationClubId =  Location::whereRaw("club_id = '{$search}'")->first();

            // Location::where('club_id', request()->get('location_club_id'))->first();

            if ($validateLocationClubId) {
                $error     = 'This Club ID is already taken';
                $errorStep = 0;
            }
        }

        /* Validate subscription */
        if (!$error) {
            $userValidator = Validator::make(request()->all(), [
                'subscription_id' => 'required|exists:stripe_products,id',
                'price_id'        => 'required|exists:stripe_product_prices,id',
            ]);

            if ($userValidator->fails()) {
                $error     = $userValidator->errors()->first();
                $errorStep = 1;
            }
        }

        /* Validate shipment info */
        if (!$error && request()->get('shipment_same_address') == '0') {
            $shipmentValidator = Validator::make(request()->all(), [
                'shipment_city'    => 'required|string|max:255',
                'shipment_state'   => 'required|string|max:255',
                'shipment_postal'  => 'required|string|max:255',
                'shipment_address' => 'required|string|max:255',
            ]);

            if ($shipmentValidator->fails()) {
                $error     = $shipmentValidator->errors()->first();
                $errorStep = 2;
            }
        }

        if ($error) {
            return response()->json([
                'success' => false,
                'error'   => $error,
                'step'    => $errorStep,
            ]);
        }

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Create a slave Location.
     * @return \Illuminate\Http\RedirectResponse
     */
    protected function slave()
    {
        $locationValidator = Validator::make(request()->all(), [
            'location_club_id' => 'required|string|max:255',
            'location_name'    => 'required|string|max:255',
            'location_city'    => 'required|string|max:255',
            'location_state'   => 'required|string|max:255',
            'location_postal'  => 'required|string|max:255',
            'location_address' => 'required|string|max:255',
            'subscription_id'  => 'required|exists:stripe_products,id',
            'price_id'         => 'required|exists:stripe_product_prices,id',
        ]);

        /* Get current user parent location */
        $parentLocation = auth()->user()->getParentLocation();
        $companyId      = $parentLocation->company_id;

        /* Get Location lat/lng */
        $url  = cURL::buildUrl('https://maps.googleapis.com/maps/api/geocode/json', [
            'address' => request()->get('location_address').' '.request()->get('location_city').' '.request()->get('location_state').' '.request()->get('location_postal').' USA',
            'key'     => config('services.google_maps.geocode_key'),
        ]);
        $response = cURL::get($url);

        $lng = 0;
        $lat = 0;
        if ($response->statusCode == 200) {
            $body = json_decode($response->body);

            if (isset($body->results)) {
                $geocode = collect($body->results)->first();
                if ($geocode) {
                    $lat = $geocode->geometry->location->lat ?? 0;
                    $lng = $geocode->geometry->location->lng ?? 0;
                }
            }
        }

        $veritap_id =  dechex( microtime(true) * 1000 ) . bin2hex( random_bytes(8) );


        /* Create location */
        $location = Location::create([
            'club_id'     => request()->get('location_club_id'),
            'name'        => request()->get('location_name'),
            'address'     => request()->get('location_address'),
            'city'        => request()->get('location_city'),
            'state'       => request()->get('location_state'),
            'postal'      => request()->get('location_postal'),
            'lat'         => $lat,
            'lng'         => $lng,
            'provisioned' => 0,
            'phone'       => request()->get('location_phone'),
            'franchise'   => $companyId,
            'company_id'  => $companyId,
            'parent_id'   => $parentLocation->id,
            'amenities_required' =>  ($companyId == 16 || $companyId == 27 || $companyId == 23)  ? true : false,
            'veritap_id'  => $veritap_id,

        ]);

        $shipment = null;
        if (request()->get('shipment_same_address') == '0') {
            $shipment = Shipment::create([
                'company_id'  => $companyId,
                'location_id' => $location->id,
                'address'     => request()->get('shipment_address'),
                'city'        => request()->get('shipment_city'),
                'state'       => request()->get('shipment_state'),
                'postal'      => request()->get('shipment_postal'),
            ]);
        }

        $stripe = new \Stripe\StripeClient(config('stripe.secret_key'));
        try {
            if (auth()->user()->isStripeEnabled()) {
                $product = Product::where('id', request()->get('subscription_id'))->first();
                if ($product) {
                    $price = $product->prices->where('id', request()->get('price_id'))->first();

                    if ($price) {
                        /* Get Stripe Customer */
                        $customer = $stripe->customers->retrieve($parentLocation->stripe_customer_id, []);

                        /* Create invoice item and connect product price to it */
                        $invoiceItem = $stripe->invoiceItems->create([
                            'customer' => $customer->id,
                            'price'    => $price->stripe_id,
                        ]);

                        $invoiceData = [
                            'customer' => $customer->id,
                        ];

                        $usedCoupon = UsedCoupon::where('location_id', $parentLocation->id)->first();
                        if ($usedCoupon) {
                            $coupon = null;
                            try {
                                $coupon = $stripe->coupons->retrieve($usedCoupon->coupon, []);
                            } catch (\Exception $e) {
                                /* ignore no coupon error */
                            }

                            if ($coupon && $coupon->valid) {
                                $invoiceData['discounts'] = [
                                    [
                                        'coupon' => $coupon->id,
                                    ],
                                ];

                                $usedCoupon->used_count = $usedCoupon->used_count + 1;
                                $usedCoupon->save();
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
                    }
                }
            }
        } catch (\Stripe\Exception\ExceptionInterface $e) {
            /* If something went wrong - no problem we can let user to register
             * but we need to check subscription inside dashboard
             */
        }

        \App\Services\Slack::sendCurlNotification('provisioning', 'New location created for *'. $parentLocation->company->name .'* brand - *'.$location->name.'* ('. $location->address .', '. $location->city .', '. $location->state .' '. $location->postal .'). *'. ($location->is_register_fee_purchased ? "PAID" : "PAYMENT REQUIRED") .'*');

        if ($shipment) {
            \App\Services\Slack::sendCurlNotification('provisioning', 'Shipment required address for *'. $parentLocation->company->name .'* brand - *'.$location->name.'* is '. $shipment->address .', '. $shipment->city .', '. $shipment->state .' '. $shipment->postal .'.');
        }

        return redirect(route('club.locations'))->with('successMessage', 'Location successfully created');
    }
}
