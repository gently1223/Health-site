<?php

namespace App\Services\Integrations\Oura;

use App\Enum\IntegrationProviderEnum;
use App\Models\Integration\IntegrationCredential;
use App\Models\Users\User;
use App\Services\Integrations\Integration;
use Carbon\Carbon;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;

class OuraClient extends Integration
{

    public function __construct($memberId = null)
    {
        parent::__construct($memberId);

        $this->apiURL = 'https://api.ouraring.com';

        $this->clientId = config('integration.ouraring.client_id');
        $this->clientSecret = config('integration.ouraring.client_secret');
        $this->redirectURI = config('app.url') . config('integration.ouraring.redirect_uri');
        $this->state = '';

        if($this->member) {
            $this->credential = IntegrationCredential::where('user_id', $this->member->id)
                ->where('provider', IntegrationProviderEnum::OURA_RING)
                ->first();
        }
    }


    public function getOauthLink(): string
    {
        $state = $this->getState();
        return "https://cloud.ouraring.com/oauth/authorize?client_id=$this->clientId&state=$state&redirect_uri=$this->redirectURI&response_type=code";
    }

    //CSRF
    public function validateState($state)
    {
        $data = null;
        try {
            $data = json_decode(Crypt::decryptString($state));
        } catch (\Exception $e) {
            throw new TokenMismatchException;
        }

        if ($data->csrf != Session::token()) {
            throw new TokenMismatchException;
        }

        $this->member = User::whereId($data->memberId)->first();

        if(!$this->member)
            throw new TokenMismatchException;
    }

    public function getAccessToken($code)
    {
        $data = [
            'grant_type'    => 'authorization_code',
            'client_id'     => $this->clientId,
            'client_secret' => $this->clientSecret,
            'redirect_uri'  => $this->redirectURI,
            'code'          => $code,
        ];

        $response = Http::asForm()->post("$this->apiURL/oauth/token", $data);

        if ($response->successful()) {
            /*
              "access_token" => "CFU5FXHTQFYPMPVY55OFLA37G7P5AC5C"
              "token_type" => "Bearer"
              "expires_in" => 86400
              "refresh_token" => "M7KMKYNU56I74BNDI3AL42THWSH7FY4Y"
            */

            $accessData = [
                "provider"      => IntegrationProviderEnum::OURA_RING,
                "access_token"  => $response['access_token'],
                "token_type"    => $response['token_type'],
                "expires_in"    => $response['expires_in'],
                "refresh_token" => $response['refresh_token']
            ];

            return $this->saveCredentials($accessData);
        }

        if ($response->json()['error_description']) {
            throw new \Exception($response['error_description']);
        }

        $response->throw();

        /*
         "status" => 400
          "title" => "Token Already Used Or Revoked"
          "detail" => "Token already used or revoked. You must create a new token."
          "error" => "invalid_grant"
          "error_description" => "Token already used or revoked. You must create a new token."
         */
    }

    public function updateAccessToken()
    {
        if(!$this->member)
            throw new \Exception('Member not found');

        $data = [
            'grant_type'    => 'refresh_token',
            'client_id'     => $this->clientId,
            'client_secret' => $this->clientSecret,
            'refresh_token' => $this->credential->refresh_token,
        ];

        $response = Http::asForm()->post("$this->apiURL/oauth/token", $data);

        if ($response->successful()) {
            /*
              "access_token" => "CFU5FXHTQFYPMPVY55OFLA37G7P5AC5C"
              "token_type" => "Bearer"
              "expires_in" => 86400
              "refresh_token" => "M7KMKYNU56I74BNDI3AL42THWSH7FY4Y"
            */

            $accessData = [
                "provider"      => IntegrationProviderEnum::OURA_RING,
                "access_token"  => $response['access_token'],
                "token_type"    => $response['token_type'],
                "expires_in"    => $response['expires_in'],
                "refresh_token" => $response['refresh_token']
            ];

             $this->saveCredentials($accessData);
        } else {

            if ($response->json()['error'] == 'invalid_grant') {
                $this->credential->delete(); // remove invalid access

                throw new \Exception($response['error_description']);
            }

            if ($response->json()['error_description']) {
                throw new \Exception($response['error_description']);
            }

            $response->throw();
        }

        /*
         "status" => 400
          "title" => "Token Already Used Or Revoked"
          "detail" => "Token already used or revoked. You must create a new token."
          "error" => "invalid_grant"
          "error_description" => "Token already used or revoked. You must create a new token."
         */
    }

    private function getAuthTokenString()
    {
        $tokenType = $this->credential->token_type;
        $token = $this->credential->access_token;

        return "$tokenType $token";
    }

    private function request($url)
    {
        if (!$this->credential)
            throw new \Exception('Token not found');

        $date = new Carbon($this->credential->expires_at);
        $diff = now()->diffInRealSeconds($date, false);

        if ($diff < 0) {
            $this->updateAccessToken();
        }

        $response = Http::withHeaders([
            'Authorization' => $this->getAuthTokenString()
        ])->get("$this->apiURL$url");

        return $response;
    }

    /**
     * Get user profile
     * @return array|mixed|void
     * @throws \Illuminate\Http\Client\RequestException
     */
    public function getProfile()
    {
        $response = $this->request("/v1/userinfo");

        if ($response->successful())
            return $response->json();

        $response->throw();
    }

    public function getActivity()
    {
        //https://cloud.ouraring.com/docs/daily-summaries
        //https://api.ouraring.com/v1/activity?start=YYYY-MM-DD&end=YYYY-MM-DD

        $response = $this->request("/v1/activity");

        if ($response->successful())
            return $response->json();

        $response->throw();
    }
}
