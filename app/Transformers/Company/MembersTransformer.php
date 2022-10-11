<?php

namespace App\Transformers\Company;

use Carbon\Carbon;
use App\Models\Company\CheckinHistory;
use League\Fractal\TransformerAbstract;

/**
 * Class MembersTransformer.
 *
 * @package namespace App\Transformers\Company;
 */
class MembersTransformer extends TransformerAbstract
{
    /**
     * Transform the member.
     *
     * @param App\Models\Company\CheckinHistory $model
     *
     * @return array
     */
    public function transform(CheckinHistory $model)
    {
        return [
            'id'                => $model->user->id,
            'photo'             => $model->user->photo,
            'displayName'       => $model->user->display_name,
            'isEligible'        => $model->user->isEligible() ? true : false,
            'latestCheckin'     => $model->timestamp,
            'latestCheckinDate' => Carbon::parse($model->timestamp) ?? null,
            'program'           => $model->program->name ?? null,
        ];
    }
}
