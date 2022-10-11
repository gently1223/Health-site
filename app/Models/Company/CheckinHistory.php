<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class CheckinHistory extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'checkin_history';

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
        'processed',
        'checkin',
        'program_id',
        'type',
        'source_id',
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
    protected $with = ['user'];

    /**
     * Get the user record associated with the checkin.
     */
    public function user()
    {
        return $this->hasOne('App\Models\Users\User', 'id', 'user_id');
    }

    public function program()
    {
        return $this->hasOne('App\Models\Program', 'id', 'program_id');
    }

}
