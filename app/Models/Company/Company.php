<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'company';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'allowance',
        'color',
        'csv_delimiter',
        'billable',
        'compressed',
        'amenities_required',
        'multi_day_checkin',
        'company_type',
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
    protected $with = ['type'];

    /**
     * Get the type for the company.
     */
    public function type()
    {
        return $this->belongsTo('App\Models\Company\CompanyType', 'company_type', 'id');
    }

    /**
     * Get the programs for the company.
     */
    public function programs()
    {
        return $this->hasMany('App\Models\Company\CompanyProgram', 'company_id', 'id')->distinct('program_id')
                    ->where('status', '=','1');
    }

    /**
     * Get active subscription for the company.
     */
    public function active_subscription()
    {
        return $this->hasOne('App\Models\Stripe\Subscription', 'stripe_customer_id', 'stripe_customer_id')
                    ->latest();
    }

    /**
     * Get the employees for the company.
     */
    public function employees()
    {
        return $this->hasManyThrough(
            'App\Models\Users\User',
            'App\Models\Company\Location',
            'company_id', // Foreign key on Location table...
            'location_id', // Foreign key on User table...
            'id', // Local key on Company table...
            'id' // Local key on Location table...
        )->with('role')->whereHas('role', function ($query) {
            $query->where('slug', '!=', 'club_member');
        });
    }

    /**
     * Get the documents for the directory.
     */
    public function directories()
    {
        return $this->hasMany('App\Models\File\Directory', 'company_id', 'id');
    }
}
