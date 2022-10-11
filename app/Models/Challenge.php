<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Challenge extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'challenge';

    protected $primaryKey = 'id';
    protected $guarded = ['id'];

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
    protected $with = ['type'];

    /**
     * Get the type record associated.
     */
    public function type()
    {
        return $this->hasOne('App\Models\ChallengeType', 'id', 'type_id');
    }

    /**
     * Get the human readable date from field.
     *
     * @param DateTime $value The created date for the course.
     *
     * @return string
     */
    public function getStartDateAttribute($value)
    {
        if (! $value) {
            return null;
        }
        return \Carbon\Carbon::parse($value)->format('M j, Y');
    }

    /**
     * Get the human readable date from field.
     *
     * @param DateTime $value The created date for the course.
     *
     * @return string
     */
    public function getEndDateAttribute($value)
    {
        if (! $value) {
            return null;
        }
        return \Carbon\Carbon::parse($value)->format('M j, Y');
    }
}
