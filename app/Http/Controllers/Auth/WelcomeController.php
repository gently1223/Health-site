<?php

namespace App\Http\Controllers\Auth;

use cURL;
use Carbon\Carbon;
use App\Http\Controllers\Controller;
use App\Mail\CorporateVerification;
use App\Providers\RouteServiceProvider;
use App\Models\Users\User;
use App\Models\Users\Roles;
use App\Models\Company\Company;
use App\Models\Stripe\Product;
use App\Services\BeaconFarm\EmailNotification;
use Illuminate\Foundation\Auth\RegistersUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;

class WelcomeController extends Controller
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

        return view('auth.welcome');
    }

    /**
     * Verify Code
     */
    public function verifyCode()
    {
        $email = request()->get('email');
        $code  = rand(100000,999999);

        Mail::to($email)->send(new CorporateVerification($code));

        if (Mail::failures()) {
            return response()->json([
                'success' => false,
                'error'   => 'We can not send email. Please try later!'
            ]);
        }

        return response()->json([
            'success' => true,
            'code'    => $code
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
        $companyValidator = Validator::make(request()->all(), [
            'company_id' => 'required|exists:company,id',
        ]);

        if ($companyValidator->fails()) {
            $error = $companyValidator->errors()->first();
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
                $errorStep = 1;
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
        $validate = [
            'company_id' => 'required|exists:company,id',
        ];

        return Validator::make($data, array_merge($validate, [
            'user_email'       => 'required|email|unique:user,email',
            'user_first_name'  => 'required|string|max:255',
            'user_last_name'   => 'required|string|max:255',
            'user_phone'       => 'required|string|max:255',
            'user_password'    => 'required|string|max:255|min:6|confirmed',
        ]));
    }

    /**
     * Handle a registration request for the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $company = Company::where('id', $request->company_id)->first();

        /* Create user */
        $role = Roles::where('slug', 'corp_wellness')->first();
        $user = User::create([
            'fname'       => $request->user_first_name,
            'lname'       => $request->user_last_name,
            'email'       => $request->user_email,
            'password'    => $request->user_password,
            'photo'       => 'https://d2x5ku95bkycr3.cloudfront.net/App_Themes/Common/images/profile/0_200.png',
            'phone'       => $request->user_phone,
            'role_id'     => $role->id,
            'company_id'  => $company->id,
            'location_id' => 0,
        ]);

        event(new Registered($user));

        $this->guard()->login($user);

        EmailNotification::sendNotification('welcome', $user->email, $user->display_name);

        if ($response = $this->registered($request, $user)) {
            return $response;
        }

        return $request->wantsJson()
                    ? new JsonResponse([], 201)
                    : redirect($this->redirectPath());
    }
}
