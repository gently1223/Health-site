<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class CompanyProgramSector extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'company_program_sector';

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
