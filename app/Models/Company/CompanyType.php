<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class CompanyType extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'company_type';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

}
