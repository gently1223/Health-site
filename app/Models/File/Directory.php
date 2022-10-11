<?php

namespace App\Models\File;

use Illuminate\Database\Eloquent\Model;

class Directory extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'file_directory';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'location_id',
        'parent_id',
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
    protected $with = ['documents'];

    /**
     * Get the documents for the directory.
     */
    public function documents()
    {
        return $this->hasMany('App\Models\File\Document', 'directory_id', 'id')
                    ->orderBy('id', 'ASC');
    }
}
