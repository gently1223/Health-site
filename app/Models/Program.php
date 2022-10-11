<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Program extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'programs';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'desc',
        'url',
        'type',
        'status',
        'web',
        'new',
        'background',
        'group',
        'valid_email',
        'header',
        'locked',
        'sector_id',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the sector record associated with the company Program.
     */
    public function sector()
    {
        return $this->hasOne('App\Models\Company\CompanyProgramSector', 'id', 'sector_id');
    }
}
