<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class CompanyProgram extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'company_program';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'company_id',
        'program_id',
        'allowance',
        'rate',
        'restriction',
        'hourly_rate',
        'daily_rate',
        'status',
        'location_id',
        'locked',
        'sector_id',
        'tier_id',
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

    /**
     * Get the tier record associated with the company Program.
     */
    public function tier()
    {
        return $this->hasOne('App\Models\Company\CompanyProgramTier', 'id', 'tier_id');
    }

    /**
     * Get the sector record associated with the company Program.
     */
    public function sector()
    {
        return $this->hasOne('App\Models\Company\CompanyProgramSector', 'id', 'sector_id');
    }
}
