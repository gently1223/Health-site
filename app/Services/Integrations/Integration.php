<?php

namespace App\Services\Integrations;

use App\Models\Integration\IntegrationCredential;
use App\Models\Users\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;

class Integration
{
    protected $member = null;

    private $credential = null;

    protected $apiURL = null;
    /**
     * Client ID
     * @var string|null
     */
    protected $clientId = null;

    /**
     * Client Secret
     * @var string|null
     */
    protected $clientSecret = null;

    /**
     * Client redirect uri
     * @var string|null
     */
    protected $redirectURI = null;

    /**
     * Session identify (csrf)
     * @var string|null
     */
    protected $state = null;

    public function __construct($memberId)
    {
        if($memberId) {
            $this->member = User::whereId($memberId)->first();
            if(!$this->member)
                throw new \Exception('Member not found');
        }
    }

    protected function getState()
    {
        return Crypt::encryptString(json_encode(
            [
                'csrf' => csrf_token(),
                'memberId' => $this->member->id
            ]
        ));
    }

    protected function saveCredentials($data)
    {
        if(!$this->member)
            throw new \Exception('Member not found');

        $credential = IntegrationCredential::where('user_id', $this->member->id)
                                           ->where('provider', $data['provider'])
                                           ->first();

        if ($credential) {
            $credential->access_token   = $data['access_token'];
            $credential->refresh_token  = $data['refresh_token'];
            $credential->expires_at     = now()->addSeconds($data['expires_in']);

            return $this->credential = $credential->save();
        } else {
            return $this->credential = IntegrationCredential::create([
                'user_id'       => $this->member->id,
                'provider'      => $data['provider'],
                'token_type'    => $data['token_type'],
                'access_token'  => $data['access_token'],
                'refresh_token' => $data['refresh_token'],
                'options'       => json_encode(isset($data['options']) ? $data['options'] : []),
                'expires_at'    => now()->addSeconds($data['expires_in']),
            ]);
        }
    }
}
