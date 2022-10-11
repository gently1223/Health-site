<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Api extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'api';

    protected $primaryKey = 'id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'apikey',
        'image',
        'company_id',
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
    protected $with = ['company'];

    /**
     * Get the porgram record associated with the company Program.
     */
    public function company()
    {
        return $this->hasOne('App\Models\Company\Company', 'id', 'company_id');
    }
}
