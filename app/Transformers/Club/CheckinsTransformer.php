<?php

namespace App\Transformers\Club;

use Carbon\Carbon;
use League\Fractal\TransformerAbstract;

/**
 * Class CheckinsTransformer.
 *
 * @package namespace App\Transformers\Company;
 */
class CheckinsTransformer extends TransformerAbstract
{
    /**
     * Transform the checkins.
     *
     * @param $collection
     *
     * @return array
     */
    public function transform($collection)
    {
        return [
            'id'           => $collection->id,
            'id_formatted' => sprintf("%05d", $collection->id),
            'memberid'     => $collection->memberid,
            'birthday'     => $collection->birthday,
            'lname'        => $collection->lname,
            'fname'        => $collection->fname,
            'timestamp'    => Carbon::parse($collection->timestamp)->format('m/d/Y h:ia') ?? null,
            'gym_pk'       => $collection->gym_pk,
            'name'         => $collection->name,
            'address'      => $collection->address,
            'city'         => $collection->city,
            'state'        => $collection->state,
            'postal'       => $collection->postal,
            'program'      => $collection->program,
        ];
    }
}
