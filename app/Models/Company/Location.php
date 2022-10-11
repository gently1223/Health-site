<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class Location extends Model
{

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'id',
        'name',
        'address',
        'city',
        'state',
        'postal',
        'lat',
        'lng',
        'provisioned',
        'franchise',
        'phone',
        'company_id',
        'stripe_customer_id',
        'is_register_fee_purchased',
        'is_register_fee_not_required',
        'image',
        'club_id',
        'payment_required',
        'parent_id',
        'amenities_required',
        'veritap_id',
        'status'
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the location payout method associated with the location.
     */
    public function payout_method()
    {
        return $this->hasOne('App\Models\Stripe\StripePayoutCustomer', 'location_id', 'id');
    }

    /**
     * Get the company record associated with the location.
     */
    public function company()
    {
        return $this->hasOne('App\Models\Company\Company', 'id', 'company_id');
    }

    /**
     * Get the documents for the directory.
     */
    public function directories()
    {
        return $this->hasMany('App\Models\File\Directory', 'location_id', 'id');
    }

    /**
     * Get the programs for the company.
     */
    public function programs_all()
    {
        return $this->hasMany('App\Models\Company\CompanyProgram', 'location_id', 'id');
    }

    /**
     * Get Location Header Home Link
     */
    public function getHeaderHomeLinkAttribute()
    {
        return trim($this->name.' / '. $this->id .' / '.$this->address);
    }

    /**
     * Get Location Programs
     */
    public function getProgramsAttribute()
    {
        if ($this->parent_id != -1) {
            $location = Location::find($this->parent_id);
        } else {
            $location = $this;
        }

        return $location->programs_all;
    }
}
