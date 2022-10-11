<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class CheckinLedger extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ledger';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'active_date',
        'location_id',
        'visit_count',
        'total',
        'company_id',
        'location_id',
        'programs_id',
        'reimbursement',
        'stripe_transaction'
    ];

    /**
     * Get location ledger for the company.
     */
    public function location()
    {
        return $this->hasOne('App\Models\Company\Location', 'id', 'location_id')
                    ->latest();
    }

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the user record associated with the checkin.
     */
    public function company()
    {
        return $this->hasOne('App\Models\Company\Company', 'id', 'company_id');
    }

    /**
     * Get the user record associated with the checkin.
     */
    public function user()
    {
        return $this->hasOne('App\Models\Users\User', 'id', 'member_id');
    }

    /**
     * Get the program record associated with the checkin.
     */
    public function program()
    {
        return $this->hasOne('App\Models\Program', 'id', 'program_id');
    }
    
}
