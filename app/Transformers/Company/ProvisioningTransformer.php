<?php

namespace App\Transformers\Company;

use App\Models\Company\Location;
use League\Fractal\TransformerAbstract;

/**
 * Class LocationsTransformer.
 *
 * @package namespace App\Transformers\Company;
 */
class ProvisioningTransformer extends TransformerAbstract
{
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
            'id'          => $model->id,
            'name'        => $model->name,
            'address'     => $model->address,
            'city'        => $model->city,
            'state'       => $model->state,
            'phone'       => $model->phone,
            'provisioned' => $model->provisioned == 1 ? true : false,
        ];
    }
}
