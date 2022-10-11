<?php

namespace App\Models\Users;

use Illuminate\Database\Eloquent\Model;

class MemberProgram extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'member_program';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'program_id',
        'membership',
        'status',
    ];

    /**
     * Get the user record associated with the member program relation.
     */
    public function user()
    {
        return $this->hasOne('App\Models\Users\User', 'id', 'user_id');
    }

    /**
     * Get the program record associated with the member program relation.
     */
    public function program()
    {
        return $this->hasOne('App\Models\Program', 'id', 'program_id');
    }

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;
}
