<?php

namespace App\Services\Integrations;

use cURL;
use Carbon\Carbon;
use App\Models\Integration\IntegrationCredential;
use App\Models\Statistics\Activity;
use Illuminate\Support\Facades\Log;

class MyWellness
{
    /**
     * Client ID
     * @var string|null
     */
    private $clientId = null;

    /**
     * Client Secret
     * @var string|null
     */
    private $clientSecret = null;

    /**
     * Client redirect uri
     * @var string|null
     */
    private $redirectURI = null;

    /**
     * Services Api Endpoint
     * @var string|null
     */
    private $servicesEndpoint = null;

    /**
     * Web Api Endpoint
     * @var string|null
     */
    private $webEndpoint = null;

    /**
     * Api Version
     * @var string
     */
    private $apiVersion = '1.1';

    /**
     * curl
     * @var cURL|null
     */
    private $curl = null;

    /**
     * Construct MyWellness
     */
    function __construct() {
        $this->clientId         = config('services.mywellness.client_id');
        $this->clientSecret     = config('services.mywellness.client_secret');
        $this->redirectURI      = config('services.mywellness.redirect_uri');
        $this->servicesEndpoint = config('services.mywellness.dev') ? 'https://services-dev.mywellness.com' : 'https://services.mywellness.com';
        $this->webEndpoint      = config('services.mywellness.dev') ? 'https://userdev.mywellness.com' : 'https://www.mywellness.com';
    }

    /**
     * Setup curl
     */
    function setupCurl() {
        cURL::setDefaultHeaders([
            'X-MWAPPS-OAUTHCLIENTID' => $this->clientId,
            'Content-Type'           => 'application/json',
        ]);
    }

    /**
     * Get MyWellness oauth link
     * @return string
     */
    public function getOauthLink()
    {
        return $this->webEndpoint.'/oauth/login?scope=read&response_type=code&client_id='.$this->clientId.'&redirect_uri='.$this->redirectURI;
    }

    /**
     * Get MyWellness access token
     * @param  string $code
     * @param  integer $memberId
     * @return array
     */
    public function getUserAccessToken($code, $memberId)
    {
        $this->setupCurl();

        $data = [
            'grant_type'    => 'authorization_code',
            'client_id'     => $this->clientId,
            'client_secret' => $this->clientSecret,
            'redirect_uri'  => $this->redirectURI,
            'code'          => $code,
        ];

        $response = cURL::rawPost($this->servicesEndpoint.'/oauth/58fb87d2-b9c1-45d1-83ce-f92c64e787af/getaccesstoken', json_encode($data, JSON_FORCE_OBJECT));
        if ($response->statusCode == 200) {
            $body = json_decode($response->body);

            if (isset($body->access_token) && $body->access_token) {
                $token = IntegrationCredential::where('user_id', $memberId)
                                              ->where('provider', 'mywellness')
                                              ->first();

                if (!$token) {
                    $token = new IntegrationCredential;
                    $token->user_id  = $memberId;
                    $token->provider = 'mywellness';
                }

                $options = [
                    'mywellness_user_id' => $body->user_id ?? '',
                ];

                $token->token_type    = $body->token_type;
                $token->access_token  = $body->access_token;
                $token->expires_at    = Carbon::parse('+ 1 year')->format('Y-m-d H:i:s');
                $token->refresh_token = '';
                $token->options       = json_encode($options);
                $token->save();

                return [
                    'success' => true,
                    'token'   => $token,
                ];
            } else {
                Log::info('[MyWellness] Response error: '. $response->statusCode, (array) json_decode($response->body));
            }
        } else {
            Log::info('[MyWellness] Response error: '. $response->statusCode, [$response->statusText]);
        }

        return [
            'success' => false,
            'message' => 'MyWellness response error',
        ];
    }

    /**
     * Get MyWellness Data for user
     * @param  IntegrationCredential $token
     * @param  string|null     $date
     * @return array
     */
    public function parseData($token, $date = null)
    {
        $this->setupCurl();

        $data = [
            'token' => $token->access_token,
        ];

        if (!$date) {
            $date = date('Y-m-d', strtotime('-0 day'));
        }

        $response = cURL::rawPost($this->servicesEndpoint.'/api/'.$this->apiVersion.'/activitystream/'.date('Ymd', strtotime($date)).'/dailycounters/', json_encode($data, JSON_FORCE_OBJECT));

        if ($response->statusCode == 200) {
            $body = json_decode($response->body);

            if (isset($body->data->totals)) {
                $move            = $body->data->totals->move ?? 0;
                $duration        = $body->data->totals->duration ?? 0;
                $calories        = $body->data->totals->calories ?? 0;
                $runningDistance = $body->data->totals->runningDistance/1609 ?? 0;
                $cyclingDistance = $body->data->totals->cyclingDistance/1609 ?? 0;

                $activity = Activity::firstOrNew([
                    'user_id'   => $token->user_id,
                    'timestamp' => $date,
                    'client_id' => 15,
                ]);

                $name = 'Training';
                if ($runningDistance > 0) {
                    $name = 'Running';
                }

                if ($cyclingDistance > 0) {
                    $name = 'Cycling';
                }

                if ($runningDistance > 0 && $cyclingDistance > 0) {
                    $name = 'Running & Cycling';
                }

                $activity->calories     = $calories;
                $activity->duration     = $duration;
                $activity->name         = $name;
                $activity->distance     = $runningDistance + $cyclingDistance;
                $activity->minutes      = ceil($duration / 60);
                $activity->equipment_id = 56;

		        if ($runningDistance + $cyclingDistance > 0) {
                    $activity->save();
                }

                return [
                    'success' => true,
                ];
            } elseif (isset($body->errors)) {
                Log::info('[MyWellness] Response error: '. $response->statusCode, (array) json_decode($response->body));
            }
        }

        return [
            'success' => false,
        ];
    }

    /**
     * Revoke token
     * @param  IntegrationCredential $token
     * @return array
     */
    public function revoke($token)
    {
        $this->setupCurl();

        $data = [
            'userId'   => $token->options_formatted->mywellness_user_id,
            'token'    => $token->access_token,
            'clientId' => $this->clientId,
        ];

        $response = cURL::rawPost($this->servicesEndpoint.'/oauth/58fb87d2-b9c1-45d1-83ce-f92c64e787af/deauthorize', json_encode($data, JSON_FORCE_OBJECT));
        return true;
    }

}
