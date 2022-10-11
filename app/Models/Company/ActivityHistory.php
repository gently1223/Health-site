<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class ActivityHistory extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'activity';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'timestamp',
        'user_id',
        'location_id',
        'lat',
        'lng',
        'score',
        'calories',
        'minutes',
        'steps',
        'distance',
        'heart',
        'duration',
        'watts',
        'water',
        'weight',
        'active',
        'name',
        'checkin',
        'sleep',
        'client_id',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Always take model with relations list
     *
     * @var array
     */
    protected $with = ['user', 'client', 'location'];

    /**
     * Get the user record associated with the checkin.
     */
    public function user()
    {
        return $this->hasOne('App\Models\Users\User', 'id', 'user_id');
    }

    /**
     * Get the client record associated with the checkin.
     */
    public function client()
    {
        return $this->hasOne('App\Models\Oauth\OauthClient', 'id', 'client_id');
    }

    /**
     * Get the location record associated with the checkin.
     */
    public function location()
    {
        return $this->hasOne('App\Models\Company\Location', 'id', 'location_id');
    }

    /**
     * Get the human readable date from field.
     *
     * @param DateTime $value The created date for the course.
     *
     * @return string
     */
    public function getTimestampAttribute($value)
    {
        if (! $value) {
            return null;
        }
        return \Carbon\Carbon::parse($value)->format('M j, Y h:i A');
    }
}
