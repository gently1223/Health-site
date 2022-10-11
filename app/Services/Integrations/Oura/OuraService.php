<?php

namespace App\Services\Integrations\Oura;

use App\Enum\IntegrationProviderEnum;
use App\Models\Integration\IntegrationCredential;
use App\Models\Statistics\Activity;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class OuraService
{

    /**
     * Import users Activity
     */
    public static function importActivity($memberId = null) : void
    {
        $credentials = IntegrationCredential::where('provider', IntegrationProviderEnum::OURA_RING);

        // import data for a specific member
        if($memberId)
            $credentials = $credentials->where('user_id', $memberId);

        $credentials = $credentials->get();

        foreach ($credentials as $credential) {
            try {
                $memberId = $credential->user_id;

                $oura = new OuraClient($memberId);
                $activity = $oura->getActivity();

                /*
                 {
                    summary_date: "2021-08-13",
                    timezone: -420,
                    day_start: "2021-08-13T04:00:00-07:00",
                    day_end: "2021-08-14T03:59:59-07:00",
                    cal_active: 58,
                    cal_total: 2087,
                    class_5min: "111111111111111111111111111112222222222222222022322222222222222222222222222233222222222222222223322211122222222222222222222223422223222234222222222232222222222222332222222222222222222222223222222222222221221111111111111111111111111211111111111112211111111111111111111111111211122111111111",
                    steps: 1195,
                    daily_movement: 767,
                    non_wear: 7,
                    rest: 614,
                    inactive: 762,
                    low: 53,
                    medium: 4,
                    high: 0,
                    inactivity_alerts: 7,
                    average_met: 1.1875,
                    met_1min: [],
                    met_min_inactive: 7,
                    met_min_low: 24,
                    met_min_medium: 15,
                    met_min_high: 0,
                    target_calories: 500,
                    target_km: 11,
                    target_miles: 6.835081,
                    to_target_km: 8.5,
                    to_target_miles: 5.2816535,
                    score: 42,
                    score_meet_daily_targets: 1,
                    score_move_every_hour: 15,
                    score_recovery_time: 100,
                    score_stay_active: 47,
                    score_training_frequency: 40,
                    score_training_volume: 30,
                    total: 57
                    }
                 */

                $clientId = config('app.env') == 'production' ? 14 : 18;

                foreach ($activity['activity'] as $item) {
                    $existActivity = Activity::where('user_id', $memberId)->where('client_id', $clientId)->where('timestamp', $item['summary_date'])->first();

                    $duration = $item['met_min_low'] + $item['met_min_medium'] + $item['met_min_high'] + (array_key_exists('met_min_medium_plus', $item) ? $item['met_min_medium_plus'] : 0);

                    if (!$existActivity) {
                        $activity = new Activity();

                        $activity->user_id      = $memberId;
                        $activity->location_id  = 9999;
                        $activity->client_id    = $clientId;
                        $activity->name         = 'Ōura';

                        $activity->timestamp    = $item['summary_date'];
                        $activity->score        = $item['score'];
                        $activity->calories     = $item['cal_total'];
                        $activity->minutes      = 0;
                        $activity->steps        = $item['steps'];
                        $activity->distance     = intval($item['steps']) / 2000;
                        $activity->duration     = $duration;
                        $activity->met          = $item['average_met'];
                        $activity->sleep        = $item['rest'];

                        $activity->save();
                    } else {
                        $existDate = new Carbon($existActivity->timestamp);
                        $todayDate = now();

                        // update date for current day
                        if ($existDate->diffInDays($todayDate) == 0) {
                            $existActivity->timestamp   = $item['summary_date'];
                            $existActivity->score       = $item['score'];
                            $existActivity->calories    = $item['cal_total'];
                            $existActivity->minutes     = 0;
                            $existActivity->steps       = $item['steps'];
                            $existActivity->distance    = intval($item['steps']) / 2000;
                            $existActivity->duration    = $duration;
                            $existActivity->met         = $item['average_met'];
                            $existActivity->sleep        = $item['rest'];


                            $existActivity->save();
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::channel('worker')->error(json_encode(
                    [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]));
            }
        }
    }
}
