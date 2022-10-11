<?php

namespace App\Models\Users;

use DB;
use Carbon\Carbon;
use App\Models\Company\Location;
use App\Models\Company\CheckinHistory;
use App\Models\Company\ActivityHistory;
use App\Models\Company\MemberProgram;
use App\Models\Company\CompanyProgram;
use App\Models\Concierge\MemberWellnessModel;

class MemberDashboardModel
{
    /**
     * Get member dashboard data
     * @param integer $memberId
     * @return array
     */
    public static function getDashboard($memberId)
    {
        $usage = "";
        $wellness = [];
        $checkins = [];
        $array_merge = [];
        $start    = now()->subYears(1)->format('Y-m-01 00:00:00');
        $startMonth    = now()->format('Y-m-01');
        $member_access = null;
        $company_program = null;

        $memberRole = Roles::where('slug', 'club_member')->first();
        $locationId = auth()->user()->location_id;

        if ($locationId) {
            $member = User::whereId($memberId)
                          ->where('role_id', $memberRole->id)
                          ->with('program', 'member_program', 'member_devices')
                          ->first();

            $program = $member && $member->member_program? $member->member_program:null;

            if ($program) {
                $company_program = CompanyProgram::whereCompanyId(auth()->user()->company->id)
                                                ->where('program_id', '=', $program->program_id)->first();

                $member_access  = CheckinHistory::selectRaw('COUNT(*) as count')
                                    ->where('location_id', $locationId)
                                    ->whereUserId($memberId)
                                    ->has('user')
                                    ->where('timestamp', '>=', $startMonth)
                                    ->where('program_id', '=', $program->program_id)
                                    ->first();
            }

            if ($member_access && $company_program) {
                $usage = $member_access->count . " OF " . $company_program->allowance;
            }

            if ($program && $company_program) {
                if ($company_program->allowance == 0)
                    $usage = "--";
             }

            $checkins = DB::select("select name, timestamp,
                1 as type from checkin_history
                inner join locations on locations.id = checkin_history.location_id
                where location_id = $locationId and user_id = $memberId and timestamp >= '$start'
                union select name, timestamp,
                2 as type from activity where client_id NOT IN (0) and user_id = $memberId and timestamp >= '$start'");

            $checkins = collect($checkins)
            ->map(function($item) {
                return [
                    'locationName' => $item->name ?? '-',
                    'date'         => Carbon::parse($item->timestamp)->format('Y-m-d'),
                    'type'         => $item->type,
                ];
            })
            ->groupBy('date')
            // ->map(function($group) {
            //     return array_unique($group->pluck(['locationName', 'type'])->toArray());
            // })
            ->toArray();

            if ($member) {
                $wellness = MemberWellnessModel::getWellness($member);

                $member->attachMemberDevices();
            }
        } else {
            $member = null;
        }

        return [
            'start'    => $start,
            'member'   => (object) $member,
            'checkins' => $checkins,
            'wellness' => $wellness,
            'usage'    => $usage,
        ];
    }

     public static function getCorporateDashboard($memberId)
    {
        $usage = "";
        $wellness = [];
        $checkins = [];
        $array_merge = [];
        $start    = now()->subYears(1)->format('Y-m-01 00:00:00');
        $startMonth    = now()->format('Y-m-01');
        $member_access = null;
        $company_program = null;

        $memberRole = Roles::where('slug', 'club_member')->first();
        $companyId = auth()->user()->company_id;

        if ($companyId) {
            $member = User::whereId($memberId)
                          ->where('role_id', $memberRole->id)
                          ->with('program', 'member_program')
                          ->first();

            $program = $member && $member->member_program? $member->member_program:null;

            if ($program) {
                $company_program = CompanyProgram::whereCompanyId(auth()->user()->company->id)
                                                ->where('program_id', '=', $program->program_id)->first();

                $member_access  = CheckinHistory::selectRaw('COUNT(*) as count')
                                    // ->where('company_id', $companyId)
                                    ->whereUserId($memberId)
                                    ->has('user')
                                    ->where('timestamp', '>=', $startMonth)
                                    ->where('program_id', '=', $program->program_id)
                                    ->first();
            }

            if ($member_access && $company_program) {
                $usage = $member_access->count . " OF " . $company_program->allowance;
            }

            if ($program && $company_program) {
                if ($company_program->allowance == 0)
                    $usage = "--";
             }

            $checkins = DB::select("select name, timestamp,
                1 as type from checkin_history
                inner join locations on locations.id = checkin_history.location_id
                where  user_id = $memberId and timestamp >= '$start'
                union select name, timestamp,
                2 as type from activity where client_id NOT IN (0) and user_id = $memberId and timestamp >= '$start'");

            $checkins = collect($checkins)
            ->map(function($item) {
                return [
                    'locationName' => $item->name ?? '-',
                    'date'         => Carbon::parse($item->timestamp)->format('Y-m-d'),
                    'type'         => $item->type,
                ];
            })
            ->groupBy('date')
            // ->map(function($group) {
            //     return array_unique($group->pluck(['locationName', 'type'])->toArray());
            // })
            ->toArray();

            if ($member) {
                $wellness = MemberWellnessModel::getWellness($member);

                $member->attachMemberDevices();
            }
        } else {
            $member = null;
        }

        return [
            'start'    => $start,
            'member'   => (object) $member,
            'checkins' => $checkins,
            'wellness' => $wellness,
            'usage'    => $usage,
        ];
    }

}
