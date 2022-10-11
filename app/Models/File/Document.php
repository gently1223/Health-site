<?php

namespace App\Models\File;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'file_documents';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'path',
        'document',
        'active',
        'location_id',
        'directory_id',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;
}
