<?php

namespace App\Transformers\Company;

use App\Models\Users\User;
use App\Models\Users\Roles;
use League\Fractal\TransformerAbstract;

/**
 * Class EmployeesTransformer.
 *
 * @package namespace App\Transformers\Company;
 */
class EmployeesTransformer extends TransformerAbstract
{

    protected $isEnterprise;

    /**
     * Construct
     *
     * @param boolean $isEnterprise
     */
    public function __construct($isEnterprise = false)
    {
        $this->isEnterprise = $isEnterprise ? true : false;
    }

    /**
     * Transform the employee.
     *
     * @param App\Models\Users\User $model
     *
     * @return array
     */
    public function transform(User $model)
    {
        $roles = Roles::getHierarchySlugsForRole(auth()->user()->role->slug);

        $modifyAllowed = auth()->user()->isAdmin() ?? false;

        if (!in_array($model->role->slug, $roles)) {
            $modifyAllowed = false;
        }

        $editLink = '';
        if ($model->role->slug == 'club_member') {
            $editLink = $this->isEnterprise ? route('enterprise.members.view', $model->id) : route('club.employees.view', $model->id);
        } else {
            $editLink = $this->isEnterprise ? route('enterprise.employees.edit', $model->id) : route('club.employees.edit', $model->id);
        }

        return [
            'id'            => $model->id,
            'photo'         => $model->photo,
            'displayName'   => $model->display_name,
            'email'         => $model->email,
            'phone'         => $model->phone,
            'location'      => $model->location->name ?? 'None',
            'roleName'      => $model->role->name ?? 'None',
            'isEmployee'    => $model->role->slug == 'club_employee' ?? false,
            'isMember'      => $model->role->slug == 'club_member' ?? false,
            'modifyAllowed' => $modifyAllowed,
            'editLink'      => $editLink,
        ];
    }
}
