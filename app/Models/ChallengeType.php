<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChallengeType extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'challenge_type';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'active'
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;


}
