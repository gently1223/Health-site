<?php

namespace App\Models\Company;

use Illuminate\Database\Eloquent\Model;

class Notifications extends Model
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
        'id',
        'title',
        'message',
        'start_date',
        'end_date',
    ];

   
}
