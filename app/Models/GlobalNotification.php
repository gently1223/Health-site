<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GlobalNotification extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'global_notifications';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'title',
        'message',
        'start_date',
        'end_date',
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = [
        'start_date',
        'end_date',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;
}
