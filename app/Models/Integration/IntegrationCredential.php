<?php

namespace App\Models\Integration;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class IntegrationCredential extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'integration_credentials';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'provider',
        'token_type',
        'access_token',
        'refresh_token',
        'expires_at',
        'options',
    ];

    /**
     * Get Options Json Decoded
     */
    public function getOptionsFormattedAttribute() {
        return json_decode($this->options);
    }

    /**
     * Revoke Device token
     * @return boolean
     */
    public function revoke() {
        switch ($this->provider) {
            case 'mywellness':
                (new \App\Services\Integrations\MyWellness)->revoke($this);

                $this->delete();
                break;

            default:
                // code...
                break;
        }

        return true;
    }
}
