<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class AmenitiesLocation extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'amenities_location';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'amenity_id',
        'location_id',
        'responses',
        'created',
        'updated',

    ];

    /**
     * The attributes that should be casted.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'responses' => 'array'
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = true;

    const CREATED_AT = 'created';
    const UPDATED_AT = 'updated';

    // /**
    //  * Get the location record associated with the amenities.
    //  */
    // public function location()
    // {
    //     return $this->hasOne('App\Models\Company\Location', 'id', 'location_id');
    // }

}
