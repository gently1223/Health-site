<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Waitlist extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'waitlist';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'legal_business_entity',
        'name_of_crossfit_affiliate',
        'address_of_location',
        'contractor_first_name',
        'contractor_last_name',
        'contractor_email',
        'direct_point_first_name',
        'direct_point_last_name',
        'direct_point_email',
        'retail_membership_rate',
    ];
}
