<?php

namespace App\Http\Controllers\Auth;

use cURL;
use Carbon\Carbon;
use App\Http\Controllers\Controller;
use App\Providers\RouteServiceProvider;
use App\Models\Users\User;
use App\Models\Users\Roles;
use App\Models\Company\Company;
use App\Models\Company\Location;
use App\Models\Company\Shipment;
use App\Models\Company\UsedCoupon;
use App\Models\Stripe\Product;
use App\Models\Stripe\Invoice;
use App\Services\BeaconFarm\EmailNotification;
use Illuminate\Foundation\Auth\RegistersUsers;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Register Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles the registration of new users as well as their
    | validation and creation. By default this controller uses a trait to
    | provide this functionality without requiring any additional code.
    |
    */

    use RegistersUsers;

    /**
     * Where to redirect users after registration.
     *
     * @var string
     */
    protected $redirectTo = RouteServiceProvider::HOME;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest');
    }

    /**
     * Show the application registration form.
     *
     * @return \Illuminate\Http\Response
     */
    public function showRegistrationForm()
    {
        $products = Product::getRegistrationFees();

        return view('auth.register', [
            'products' => $products,
        ]);
    }

    /**
     * Validate Card
     */
    public function getCardToken()
    {
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
        } catch (\Stripe\Exception\ExceptionInterface $e) {
            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'token'   => $token->id,
        ]);
    }

    /**
     * Validate
     */
    public function validateRequest()
    {
        $errorStep = 0;
        $error     = false;

        /* Validate company */
        $companyType = request()->get('type');
        if ($companyType == 'join_to_company') {
            $companyValidator = Validator::make(request()->all(), [
                'company_id' => 'required|exists:company,id',
            ]);
        } elseif ($companyType == 'new_company') {
            $companyValidator = Validator::make(request()->all(), [
                'company_name' => 'required|string|max:255',
            ]);
        }

        if ($companyValidator->fails()) {
            $error = $companyValidator->errors()->first();
        }

        /* Ignore case differences when create new brand */
        if (!$error && $companyType == 'new_company') {
            $companyNameToLowerCase = strtolower(request()->get('company_name'));
            $companyWithSameName = Company::whereRaw("LOWER(name) = '{$companyNameToLowerCase}'")->first();

            if ($companyWithSameName) {
                $error = 'The Brand Name has already been taken.';
            }
        }

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
                $errorStep = 1;
            }

            $validateLocationClubId = Location::where('club_id', request()->get('location_club_id'))->first();
            if ($validateLocationClubId) {
                $error     = 'This Club ID is already taken';
                $errorStep = 1;
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
                $errorStep = 2;
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
                $errorStep = 3;
            }
        }

        /* Validate card token */
        if (!$error) {
            $userValidator = Validator::make(request()->all(), [
                'stripe_token' => 'required',
            ]);

            if ($userValidator->fails()) {
                $error     = $userValidator->errors()->first();
                $errorStep = 4;
            }
        }

        /* Validate user */
        if (!$error) {
            $userValidator = Validator::make(request()->all(), [
                'user_email'      => 'required|email|unique:user,email',
                'user_first_name' => 'required|string|max:255',
                'user_last_name'  => 'required|string|max:255',
                'user_password'   => 'required|string|max:255|min:6|confirmed',
                'terms'           => 'required|accepted',
            ]);

            if ($userValidator->fails()) {
                $error     = $userValidator->errors()->first();
                $errorStep = 5;
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
     * Get a validator for an incoming registration request.
     *
     * @param  array  $data
     * @return \Illuminate\Contracts\Validation\Validator
     */
    protected function validator(array $data)
    {
        $validate = [];

        $companyType = request()->get('registration_type');

        if ($companyType == 'join_to_company') {
            $validate = [
                'company_id' => 'required|exists:company,id',
            ];
        } elseif ($companyType == 'new_company') {
            $validate = [
                'company_name' => 'required|string|max:255',
            ];
        }

        if (request()->get('shipment_same_address') == '0') {
            array_merge($validate, [
                'shipment_city'    => 'required|string|max:255',
                'shipment_state'   => 'required|string|max:255',
                'shipment_postal'  => 'required|string|max:255',
                'shipment_address' => 'required|string|max:255',
            ]);
        }

        return Validator::make($data, array_merge($validate, [
            'location_name'    => 'required|string|max:255',
            'location_city'    => 'required|string|max:255',
            'location_state'   => 'required|string|max:255',
            'location_postal'  => 'required|string|max:255',
            'location_address' => 'required|string|max:255',
            'location_phone'   => 'required|string|max:255',
            'location_club_id' => 'required|string|max:255',
            'user_email'       => 'required|email|unique:user,email',
            'user_first_name'  => 'required|string|max:255',
            'user_last_name'   => 'required|string|max:255',
            'user_phone'       => 'required|string|max:255',
            'user_password'    => 'required|string|max:255|min:6|confirmed',
        ]));
    }

    /**
     * Create a new user instance after a valid registration.
     *
     * @param  array  $data
     * @return \App\User
     */
    protected function create(array $data)
    {
        $isCrossfitCompany = false;
        /* Create company */
        $companyType = request()->get('registration_type');

        if ($companyType == 'join_to_company') {
            $company = Company::where('id', $data['company_id'])->first();

            if ($company->id == 16 || $company->id == 27 || $company->id == 23 || $company->id == 35) {
                $isCrossfitCompany = true;
            }

        } elseif ($companyType == 'new_company') {
            $company = Company::create([
                'name'      => $data['company_name'],
                'allowance' => 0,
                'color'     => '233746',
            ]);
        }

        $url  = cURL::buildUrl('https://maps.googleapis.com/maps/api/geocode/json', [
            'address' => $data['location_address'].' '.$data['location_city'].' '.$data['location_state'].' '.$data['location_postal'].' USA',
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

        $veritap_id =  dechex( microtime(true) * 1000 ) . bin2hex( random_bytes(12) );
        /* Create location */
        $location = Location::create([
            'club_id'     => $data['location_club_id'],
            'name'        => $data['location_name'],
            'address'     => $data['location_address'],
            'city'        => $data['location_city'],
            'state'       => $data['location_state'],
            'postal'      => $data['location_postal'],
            'lat'         => $lat,
            'lng'         => $lng,
            'provisioned' => 0,
            'phone'       => $data['location_phone'],
            'franchise'   => $company->id,
            'company_id'  => $company->id,
            'payment_required'   => $isCrossfitCompany,
            'amenities_required' => $isCrossfitCompany,
            'veritap_id'         => $veritap_id,
        ]);

        /* Create user */
        $role = Roles::where('slug', 'club_admin')->first();
        $user = User::create([
            'fname'       => $data['user_first_name'],
            'lname'       => $data['user_last_name'],
            'email'       => $data['user_email'],
            'password'    => $data['user_password'],
            'photo'       => 'https://d2x5ku95bkycr3.cloudfront.net/App_Themes/Common/images/profile/0_200.png',
            'phone'       => $data['user_phone'],
            'role_id'     => $role->id,
            'company_id'  => $company->id,
            'location_id' => $location->id,
        ]);

        $shipment = null;
        if (request()->get('shipment_same_address') == '0') {
            $shipment = Shipment::create([
                'company_id'  => $company->id,
                'location_id' => $location->id,
                'address'     => $data['shipment_address'],
                'city'        => $data['shipment_city'],
                'state'       => $data['shipment_state'],
                'postal'      => $data['shipment_postal'],
            ]);
        }

        $stripe = new \Stripe\StripeClient(config('stripe.secret_key'));
        try {
            /* Create Stripe Customer */
            $customer = $stripe->customers->create([
                'name'   => $company->name,
                'email'  => $user->email,
                'source' => request()->get('stripe_token'),
            ]);

            $location->stripe_customer_id = $customer->id;
            $location->save();

            $product = Product::where('id', request()->get('subscription_id'))->first();

            if ($product) {
                $price = $product->prices->where('id', request()->get('price_id'))->first();

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

                        if ($coupon && $coupon->valid) {
                            $invoiceData['discounts'] = [
                                [
                                    'coupon' => $coupon->id,
                                ],
                            ];

                            UsedCoupon::create([
                                'company_id'  => $company->id,
                                'location_id' => $location->id,
                                'used_count'  => 1,
                                'coupon'      => request()->get('promocode'),
                            ]);
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
        } catch (\Stripe\Exception\ExceptionInterface $e) {
            /* If something went wrong - no problem we can let user to register
             * but we need to check subscription inside dashboard
             */
        }

        EmailNotification::sendNotification('welcome', $user->email, $user->display_name);

        \App\Services\Slack::sendCurlNotification('provisioning', 'New location registered for *'. $company->name .'* brand - *'.$location->name.'* ('. $location->address .', '. $location->city .', '. $location->state .' '. $location->postal .').');

        if ($shipment) {
            \App\Services\Slack::sendCurlNotification('provisioning', 'Shipment required address for *'. $company->name .'* brand - *'.$location->name.'* is '. $shipment->address .', '. $shipment->city .', '. $shipment->state .' '. $shipment->postal .'.');
        }

        return $user;
    }
}
