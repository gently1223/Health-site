<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class CompanyProgramTier extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'company_program_tier';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'status',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;
}
