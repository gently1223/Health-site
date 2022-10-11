<?php

namespace App\Http\Controllers\Auth;

use Auth;
use App\Models\Users\User;
use App\Models\Users\Roles;
use App\Http\Controllers\Controller;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\AuthenticatesUsers;

class LoginController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Login Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles authenticating users for the application and
    | redirecting them to your home screen. The controller uses a trait
    | to conveniently provide its functionality to your applications.
    |
    */

    use AuthenticatesUsers;

    /**
     * Where to redirect users after login.
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
        $this->middleware('guest')->except('logout');
    }

    /**
     * Attempt to log the user into the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function attemptLogin(Request $request)
    {
        $data     = $this->credentials($request);
        $email    = $data['email'];
        $password = $data['password'];

        $disableRole = Roles::where('slug', 'club_member')->first();

        $isExist = User::whereEmail($email)
                       ->wherePassword($password)
                       ->where('role_id', '!=', $disableRole->id)
                       ->first();

        if ($isExist) {
            Auth::loginUsingId($isExist->id);
            return true;
        }

        return false;
    }
}
