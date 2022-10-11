<?php

namespace App\Models\Statistics;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
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
        'user_id',
        'checkin',
        'timestamp',
        'location_id',
        'lat',
        'lng',
        'score',
        'calories',
        'minutes',
        'steps',
        'distance',
        'heart',
        'checkout',
        'duration',
        'watts',
        'water',
        'weight',
        'active',
        'feeling',
        'bmi',
        'processed',
        'money',
        'savings',
        'equipment_id',
        'name',
        'client_id',
        'sleep',
        'met',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the user record associated with the activity relation.
     */
    public function user()
    {
        return $this->hasOne('App\Models\Users\User', 'id', 'user_id');
    }
}
