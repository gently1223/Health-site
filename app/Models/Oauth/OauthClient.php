<?php

namespace App\Models\Oauth;

use Illuminate\Database\Eloquent\Model;

class OauthClient extends Model
{
    protected $table = 'oauth_client';

    protected $fillable = [
        'name',
        'client_id',
        'timestamp',
        'secret',
        'endpoint',
        'logo',
        'field',
        'company_id',
        'program_id',
        'target_logo',
        'button_text'
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the user record associated with the checkin.
     */
    public function program()
    {
        return $this->hasOne('App\Models\Program', 'id', 'program_id');
    }
}
