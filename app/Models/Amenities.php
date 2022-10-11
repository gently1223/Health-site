<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Amenities extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'amenities';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'type',
        'title',
        'description',
        'responses',
        'required',
        'additional_textarea',
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
    public $timestamps = false;
}
