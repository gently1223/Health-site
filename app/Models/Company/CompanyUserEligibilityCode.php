<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class CompanyUserEligibilityCode extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'company_user_eligibility_codes';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'company_id',
        'user_id',
        'code',
    ];
}
