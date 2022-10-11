<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class CheckinLedgerMember extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ledger_member';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'active_date',
        'visit_count',
        'location_id',
        'total',
        'company_id',
        'member_id',
        'program_id',
        'parent_id',
        'visit_process_count',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

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
