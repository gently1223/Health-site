<?php

namespace App\Transformers\Company;

use App\Models\Company\CheckinLedger;
use Carbon\Carbon;
use League\Fractal\TransformerAbstract;

/**
 * Class MembersFromLedgerTransformer.
 *
 * @package namespace App\Transformers\Company;
 */
class LedgerTransformer extends TransformerAbstract
{
    /**
     * Transform the member from User model.
     *
     * @param App\Models\Company\User $model
     *
     * @return array
     */
    public function transform(CheckinLedger $model)
    {
        return [
            'id'                => $model->user?$model->user->id:null,
            'photo'             => $model->user?$model->user->photo:null,
            'displayName'       => $model->user?$model->user->display_name:null,
            'isEligible'        => $model->user&&$model->user->isEligible() ? true : false,
            'latestCheckin'     => $model->active_date,
            'latestCheckinDate' => Carbon::parse($model->active_date) ?? null,
            'program'           => $model->program->name ?? null,
        ];
    }
}
