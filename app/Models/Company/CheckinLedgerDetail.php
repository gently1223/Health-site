<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class CheckinLedgerDetail extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ledger_detail';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'active_date',
        'member_id',
        'location_id',
        'processed',
        'visit_account',
        'program_id',
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
