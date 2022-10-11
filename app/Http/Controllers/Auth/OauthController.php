<?php

namespace App\Http\Controllers\Auth;

use App\Models\Oauth\OauthClient;

use App\Http\Controllers\Controller;

class OauthController extends Controller
{

    public function index()
    {
        $client_id = request()->get('client_id');

        $account = request()->get('account');
        if ($account === NULL) $account = 1;

        $client = OauthClient::where('client_id', $client_id)
                             ->first();

        if (!$client) return abort(404);

        return view('oauth.auth', [
            'client'  => $client,
            'account' => $account,
        ]);
    }

    public function register()
    {
        $request = request()->all();

        if (request()->get('error')) {
            session(['errorMessage' => request()->get('error_description', 'Oops. Something went wrong.')]);
        } else {
            session()->forget('errorMessage');
        }

        $filled = [
            'firstname'  => request()->get('firstname', ''),
            'lastname'   => request()->get('lastname', ''),
            'email'      => request()->get('email', ''),
            'account_id' => request()->get('account_id', ''),
        ];

        $client_id = request()->get('client_id');
       
        $account = request()->get('account');
        if ($account === NULL) $account = 1;

        $client = OauthClient::where('client_id', $client_id)
                             ->first();

        if (!$client) return abort(404);

        return view('oauth.register', [
            'client'  => $client,
            'account' => $account,
            'filled'  => $filled,
        ]);
    }

}
