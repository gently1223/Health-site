<?php

namespace App\Transformers\Company;

use Carbon\Carbon;
use App\Models\Users\User;
use League\Fractal\TransformerAbstract;

/**
 * Class MembersFromUserTransformer.
 *
 * @package namespace App\Transformers\Company;
 */
class MembersFromUserTransformer extends TransformerAbstract
{
    /**
     * Transform the member from User model.
     *
     * @param App\Models\Company\User $model
     *
     * @return array
     */
    public function transform(User $model)
    {
        return [
            'id'                => $model->id,
            'photo'             => $model->photo,
            'displayName'       => $model->display_name,
            'isEligible'        => $model->isEligible() ? true : false,
            'latestCheckin'     => null,
            'latestCheckinDate' => null,
            'program'           => $model->program ? $model->program->name : '',
        ];
    }

    /**
     * Transform the member.
     *
     * @param array $members  [Members list]
     * @param array $checkins [Members latest checkins]
     *
     * @return array
     */
    public static function combineWithCheckins($members, $checkins)
    {
        foreach ($members as $key => $member) {
            if (isset($checkins[$member['id']])) {
                $members[$key]['latestCheckin']     = Carbon::parse($checkins[$member['id']]->timestamp)->format('m/d/Y h:ia') ?? null;
                $members[$key]['latestCheckinDate'] = Carbon::parse($checkins[$member['id']]->timestamp) ?? null;
            }
        }

        return array_values(collect($members)->sortByDesc('latestCheckinDate')->toArray());
    }
}
