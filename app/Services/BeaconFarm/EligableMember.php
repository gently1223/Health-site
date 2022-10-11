<?php

namespace App\Services\BeaconFarm;

use cURL;
use App\Models\Program;

class EligableMember
{
    /**
     * Check Eligibility code
     *
     * @var string $code
     * @return array
     */

    //beaconfarm.co
    public static function check($code, $programId)
    {
        $program = Program::with('sector')
                          ->where('id', $programId)
                          ->first();

        $response = cURL::newRequest('post', 'https://beaconfarm.co/renewactive', [
                            'code' => $code,
                            'sector' => $program->sector && $program->sector->name ? $program->sector->name : 'None',
                        ])
                        ->setHeader('Content-Type', 'application/x-www-form-urlencoded')
                        ->send();

        $body = json_decode($response->body);

        return [
            'error'    => $body->statusCode,
            'eligible' => $body->statusCode == 200 ? true : false,
            'message'  => $body->status,
        ];
    }

    /**
     * Verify Optum Eligibility code
     *
     * @var integer $location_id
     * @var integer $program_id
     * @var integer $member_id
     * @var string  $code
     * @return array
     */
    public static function verifyOptumEligibility($location_id, $program_id, $member_id, $code)
    {
        $response = cURL::newRequest('post', 'https://beaconfarm.co/verifyOptumEligibility', [
                            'location_id' => $location_id,
                            'program_id'  => $program_id,
                            'member_id'   => $member_id,
                            'code'        => $code,
                        ])
                        ->setHeader('Content-Type', 'application/x-www-form-urlencoded')
                        ->send();

        $body = json_decode($response->body);

        return [
            'code'    => $body->code == 200 ? true : false,
            'message' => $body->status,
        ];
    }
}
