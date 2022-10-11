<?php

namespace App\Transformers\Company;

use App\Models\Company\Location;
use League\Fractal\TransformerAbstract;

/**
 * Class LocationsTransformer.
 *
 * @package namespace App\Transformers\Company;
 */
class LocationsTransformer extends TransformerAbstract
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
     * Transform the location.
     *
     * @param App\Models\Company\Location $model
     *
     * @return array
     */
    public function transform(Location $model)
    {
        return [
            'id'              => $model->id,
            'club_id'         => $model->club_id,
            'name'            => $model->name,
            'address'         => $model->address,
            'city'            => $model->city,
            'state'           => $model->state,
            'phone'           => $model->phone,
            'modifyAllowed'   => auth()->user()->isAdmin() ?? false,
            'editLink'        => $this->isEnterprise ? route('enterprise.locations.edit', $model->id) : route('club.locations.edit', $model->id),
            'switchLink'      => auth()->user()->isEnterprise() ? route('enterprise.locations.switch', $model->id) : null,
            'switchClubLink'  => route('club.locations.switch', $model->id),
            'currentLocation' => auth()->user()->location_id == $model->id ?? false,
            'parent_id'       => $model->parent_id ,
        ];
    }
}
