<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class UsedCoupon extends Model
{

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'company_id',
        'location_id',
        'coupon',
        'used_count',
    ];

    /**
     * Get the company record associated with the shipment.
     */
    public function company()
    {
        return $this->hasOne('App\Models\Company\Company', 'id', 'company_id');
    }

    /**
     * Get the location record associated with the shipment.
     */
    public function location()
    {
        return $this->hasOne('App\Models\Company\Location', 'id', 'location_id');
    }
}
