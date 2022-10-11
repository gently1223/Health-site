<?php

namespace App\Models\Concierge;

use Carbon\Carbon;
use App\Helpers\NumberHelper;
use App\Models\Company\ActivityHistory;

class MemberWellnessModel
{
    /**
     * Get member Wellness data for member dasbhoard
     * @param  \App\Models\Users\User $member [member user instance]
     * @return array
     */
    public static function getWellness($member)
    {
        $latest21DaysActivity = ActivityHistory::
                                selectRaw("timestamp, sum(score) as score ,AVG(calories) as calories ,AVG(steps) as steps ,AVG(distance) as distance,AVG(duration) as duration,AVG(watts) as watts, AVG(weight) as weight, AVG(BMI) as bmi, AVG(water) as water")
                                            ->where('user_id', $member->id)
                                         ->where('timestamp', '>', Carbon::now()->subDays(30)->format('Y-m-d 00:00:00'))
                                         ->groupBy('timestamp')
                                         ->orderBy('timestamp', 'DESC')
                                         ->get();

        $latestActivity = ActivityHistory::where('user_id', $member->id)
                                         ->orderBy('id', 'DESC')->first();

        $weightData = [
            'labels'  => [],
            'dataset' => [],
        ];

        foreach ($latest21DaysActivity as $data){
            $weightData['labels'][]  = Carbon::parse($data->timestamp)->format('Y-m-d');
            $weightData['dataset'][] = $data->weight;
        }

        $distanceData = [
            'labels'  => [],
            'dataset' => [],
        ];

        foreach ($latest21DaysActivity as $data){
            $distanceData['labels'][]  = Carbon::parse($data->timestamp)->format('Y-m-d');
            $distanceData['dataset'][] = $data->distance;
        }


       $stepsData = [
            'labels'  => [],
            'dataset' => [],
        ];

        foreach ($latest21DaysActivity as $data){
            $stepsData['labels'][]  = Carbon::parse($data->timestamp)->format('Y-m-d');
            $stepsData['dataset'][] = $data->steps;
        }

        $activityData = [
            'labels'  => [],
            'dataset' => [],
        ];

        foreach ($latest21DaysActivity as $data){
            $activityData['labels'][]  = Carbon::parse($data->timestamp)->format('Y-m-d');
            $activityData['dataset'][] = $data->calories;
        }

        $durationData = [
            'labels'  => [],
            'dataset' => [],
        ];

        foreach ($latest21DaysActivity as $data){
            $durationData['labels'][]  = Carbon::parse($data->timestamp)->format('Y-m-d');
            $durationData['dataset'][] = $data->duration/60;
        }

        $wattsData = [
            'labels'  => [],
            'dataset' => [],
        ];

        foreach ($latest21DaysActivity as $data){
            $wattsData['labels'][]  = Carbon::parse($data->timestamp)->format('Y-m-d');
            $wattsData['dataset'][] = $data->watts;
        }

        return [
            'points' => [
                'type'  => 'number',
                'value' => $latestActivity ? NumberHelper::toKMFormat(intval($latestActivity->score)) : 0,
            ],
            'calories' => [
                'type'  => 'number',
                'value' => $latestActivity ? NumberHelper::toKMFormat(intval($latestActivity->calories)) : 0,
            ],
            'heart' => [
                'type'  => 'number',
                'value' => $latestActivity ? NumberHelper::toKMFormat($latestActivity->heart) : 0,
            ],
            'weight' => [
                'type'  => 'number',
                'value' => $latestActivity ? NumberHelper::toKMFormat($latestActivity->weight) : 0,
            ],
            'activity' => [
                'type'   => 'barGraph',
                'title'  => '21 days',
                'data'   => $activityData,
                'color'  => '#E54F05',
            ],
             'steps' => [
                'type'   => 'barGraph',
                'title'  => '21 days',
                'data'   => $stepsData,
                'color'  => '#0ECBAB',
            ],
            'weight' => [
                'type'   => 'barGraph',
                'title'  => '21 days',
                'data'   => $weightData,
                'color'  => '#443371',
            ],
            'bmi' => [
                'type'   => 'barGraph',
                'title'  => '21 days',
                'data'   => $distanceData,
                'color'  => '#C1E367',
            ],
            'water' => [
                'type'   => 'barGraph',
                'title'  => '21 days',
                'data'   => $durationData,
                'color'  => '#059AE5',
            ],
            'watts' => [
                'type'   => 'barGraph',
                'title'  => '21 days',
                'data'   => $wattsData,
                'color'  => '#178FBF',
            ],
        ];
    }
}
