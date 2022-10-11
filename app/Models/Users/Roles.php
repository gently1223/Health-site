<?php

namespace App\Models\Users;

use Illuminate\Database\Eloquent\Model;

class Roles extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'role';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'slug',
        'url'
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get roles hierarchy
     *
     * @var    string $role [user role slug]
     * @return array
     */
    public static function getHierarchyForRole($role)
    {
        $rolesHierarchy = self::getHierarchy();

        $rolesBelow = $rolesHierarchy[$role] ?? [];

        if (count($rolesBelow)) {
            return Roles::whereIn('slug', $rolesBelow)->get()->pluck('name', 'slug')->toArray();
        }

        return [];
    }

    /**
     * Get roles hierarchy
     *
     * @var    string $role [user role slug]
     * @return array
     */
    public static function getHierarchySlugsForRole($role)
    {
        $rolesHierarchy = self::getHierarchy();

        return $rolesHierarchy[$role] ?? [];
    }

    /**
     * Get roles hierarchy
     *
     * @return array
     */
    public static function getHierarchy()
    {
        $allRoles = Roles::pluck('slug')->toArray();

        return [
            'root'            => $allRoles,
            'club_enterprise' => array_values(array_diff($allRoles, ['root'])),
            'club_admin'      => ['club_admin', 'insurance', 'club_employee', 'club_member'],
            'insurance'       => ['club_admin', 'insurance', 'club_employee', 'club_member'],
            'club_employee'   => ['club_employee', 'club_member'],
        ];
    }
}
