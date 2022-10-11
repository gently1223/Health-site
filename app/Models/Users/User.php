<?php

namespace App\Models\Users;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    const CREATED_AT = 'timeStamp';

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'user';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'fname',
        'lname',
        'email',
        'password',
        'photo',
        'birthday',
        'phone',
        'deed_id_old',
        'role_id',
        'version_id',
        'alias',
        'about',
        'timeStamp',
        'stripeCard',
        'stripeId',
        'stripeSubscription',
        'program_id',
        'company_id',
        'savings',
        'score',
        'membership',
        'location_id',
        'group',
        'gender',
        'eligible',
        'eligibility_status'
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = [
        'timeStamp',
        'birthday'
    ];

    /**
     * Always take model with relations list
     *
     * @var array
     */
    protected $with = ['role', 'location', 'company'];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Indicates if the model should be timestamped.
     *
     * @var \App\Models\Company\Location|null
     */
    protected $parentLocation = null;

    /**
     * Get the role record associated with the user.
     */
    public function role()
    {
        return $this->hasOne('App\Models\Users\Roles', 'id', 'role_id');
    }

    /**
     * Get the company record associated with the user.
     */
    public function company()
    {
        return $this->hasOne('App\Models\Company\Company', 'id', 'company_id');
    }

    /**
     * Get the location record associated with the user.
     */
    public function location()
    {
        return $this->hasOne('App\Models\Company\Location', 'id', 'location_id');
    }

    /**
     * Get the program record associated with the user.
     */
    public function program()
    {
        return $this->hasOne('App\Models\Program', 'id', 'program_id');
     }

    /**
     * Get the member_program record associated with the user.
     */
    public function member_program()
    {
        return $this->hasOne('App\Models\Users\MemberProgram', 'user_id', 'id');
    }

    /**
     * Get the member_devices record associated with the user.
     */
    public function member_devices()
    {
        return $this->hasMany('App\Models\Integration\IntegrationCredential', 'user_id', 'id');
    }

    /**
     * Get parent location
     *
     * @return \App\Models\Company\Location
     */
    public function getParentLocation()
    {
        if (!$this->parentLocation) {
            if ($this->location->parent_id > 0) {
                $parentLocation = \App\Models\Company\Location::where('id', $this->location->parent_id)->first();

                if ($parentLocation) {
                    $this->parentLocation = $parentLocation;
                } else {
                    $this->parentLocation = $this->location;
                }
            } else {
                $this->parentLocation = $this->location;
            }
        }

        return $this->parentLocation;
    }

    /**
     * Show user full name
     *
     * @var bool
     */
    public function getDisplayNameAttribute() {
        return trim($this->fname.' '.$this->lname);
    }
    /**
     * Show user id
     *
     * @var bool
     */
    public function getUserIDAttribute() {
        return $this->id;
    }

    public function getUserEmailAttribute() {
        return $this->email;
    }

    /**
     * Get created at
     *
     * @var bool
     */
    public function getCreatedDateAttribute() {
        return $this->timeStamp->format('m/d/Y');
    }

    /**
     * Get birthday
     */
    public function getBirthdayDateAttribute() {
        return $this->birthday ? $this->birthday->format('m/d/Y') : '';
    }

    /**
     * Get age
     */
    public function getAgeAttribute() {
        return $this->birthday ? $this->birthday->age : null;
    }

    /**
     * Get Member Devices Formatted
     */
    public function getMemberDevicesFormattedAttribute() {
        $devices = [];

        foreach ($this->member_devices as $device) {
            $device = $device->toArray();
            $device['options'] = json_decode($device['options'], true);

            $devices[$device['provider']] = $device;
        }

        return $devices;
    }

    /**
     * Attach Member Devices Attribute
     */
    public function attachMemberDevices() {
        $this->attributes['devices'] = $this->member_devices_formatted;
    }

    /**
     * Get birthday
     *
     * @var bool
     */
    public function getEligibleColorAttribute() {
        switch ($this->eligibility_status) {
            case 'Eligible':
                return 'green';
            break;

            case 'Unknown':
                return 'amber darken-2';
            break;
        }

        return 'red';
    }

    /**
     * Check if user has role
     *
     * @var bool
     */
    public function hasRole($roles)
    {
        $roles = explode('|', $roles);

        if ($this->role && in_array(strtolower($this->role->slug), $roles)) {
            return true;
        }

        return false;
    }

    /**
     * Check if user is Employee
     *
     * @var bool
     */
    public function isMember()
    {
        return $this->hasRole('club_member');
    }

     public function isClubAdmin()
    {
        return $this->hasRole('club_admin');
    }

    /**
     * Check if user is Employee
     *
     * @var bool
     */
    public function isInsurance()
    {
        return $this->hasRole('insurance|club_enterprise|root');
    }

    public function isVendor()
    {
        return $this->hasRole('insurance|club_enterprise|root|vendor');
    }

     public function isCorporate()
    {
        return $this->hasRole('corp_wellness|root');
    }

    /**
     * Check if user is Employee
     *
     * @var bool
     */
    public function isEmployee()
    {
        return $this->hasRole('insurance|club_employee|club_admin|club_enterprise|root');
    }

    /**
     * Check if user is Admin
     *
     * @var bool
     */
    public function isAdmin()
    {
        return $this->hasRole('insurance|club_admin|club_enterprise|root|corp_wellness');
    }

    /**
     * Check if user is Enterprise
     *
     * @var bool
     */
    public function isEnterprise()
    {
        return $this->hasRole('club_enterprise|root|insurance');
    }

    /**
     * Check if user is Root
     *
     * @var bool
     */
    public function isRoot()
    {
        return $this->hasRole('root');
    }

    /**
     * Check if user is Eligible
     *
     * @var bool
     */
    public function isEligible()
    {
        return $this->eligibility_status == 'Eligible' ;
    }

    /**
     * Check if location register fee paid
     *
     * @var bool
     */
    public function isStripeEnabled()
    {
        $location = $this->getParentLocation();

        if ($location) {
            return $location->stripe_customer_id ? true : false;
        }

        return false;
    }

        /**
     * Check if users comes from master or slave
     *
     * @var bool
     */
    public function isMasterLocation()
    {
        $location = $this->location()->first();

        if ($location) {
            return ($location->parent_id == -1);
        }

        return false;
    }

    /**
     * Check if location register fee paid
     *
     * @var bool
     */
    public function isRegisterFeePaid()
    {
        $location = $this->getParentLocation();

        if ($location) {
            return $location->is_register_fee_not_required || $location->is_register_fee_purchased;
        }

        return false;
    }

    /**
     * Check if user currently on club parent location
     *
     * @var bool
     */
    public function isOnClubParentLocation()
    {
        return $this->location->parent_id == -1 ? true : false;
    }

}
