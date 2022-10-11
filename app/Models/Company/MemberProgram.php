<?php

namespace App\Models\Company;

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
    protected $with = ['program'];

    /**
     * Get the porgram record associated with the company Program.
     */
    public function program()
    {
        return $this->hasOne('App\Models\Program', 'id', 'program_id');
    }
}
