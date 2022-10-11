<?php

namespace App\Http\Controllers\Root;

use App\Models\Api;
use DB;
use Carbon\Carbon;
use App\Models\Statistics\Activity;

class ReportsController extends \App\Http\Controllers\Controller
{
    /**
     * Show activity reports page.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function activityReport()
    {
        $startYear = 2021;
        $selectedYear  = request()->ajax() ? request()->get('year') : now()->format('Y');
        $selectedMonth = request()->ajax() ? request()->get('month') : now()->format('n');
        $selectedApi = request()->ajax() ? request()->get('company_id') : 0;

        $years     = [];
        for ($i = $startYear; $i <= intval(now()->format('Y')); ++$i) {
            $years[] = [
                'id'     => $i,
                'active' => $selectedYear == $i ? true : false,
            ];
        }

        $months = [
            [
                'id' => 0,
                'active' => $selectedMonth == 0 ? true : false,
                'title'  => 'All',
            ],
        ];
        for ($m = 1; $m <= 12; ++$m) {
            $monthName = Carbon::createFromFormat('n', $m)->format('F');

            $months[] = [
                'id'     => $m,
                'active' => $m == $selectedMonth,
                'title'  => $monthName,
            ];
        }

        $apis = Api::orderBy('name', 'ASC')
                            ->get()
                            ->map(function($item) use ($selectedApi) {
                                return [
                                    'id'     => $item->id,
                                    'title'  => $item->name,
                                    'active' => $selectedApi == $item->id,
                                ];
                            })->toArray();

        array_unshift($apis , [
            'id'     => 0,
            'title'  => 'All',
            'active' => $selectedApi == 0,
        ]);

        $whereDate = "EXTRACT(YEAR FROM activity.timestamp) = '{$selectedYear}'";
        if ($selectedMonth > 0) {
            $whereDate .= " AND EXTRACT(MONTH FROM activity.timestamp) = '{$selectedMonth}'";
        }

        /* Get Transfers */
        $transfers = Activity::select('activity.id', 'activity.timestamp', 'user.fname', 'user.lname', 'activity.name', 'activity.duration', 'api.name as program')
                                  ->join('user', 'user.id', '=', 'activity.user_id')
                                  ->join('api', 'api.id', '=', 'activity.client_id')

                                  ->where(function($query) use ($selectedApi) {
                                    if ($selectedApi > 0) $query->where('activity.client_id', $selectedApi);
                                  })
                                  ->whereRaw($whereDate)
                                  ->orderBy('timestamp', 'DESC')
                                  ->get()
                                  ->map(function($item) {
                                    $item->duration = gmdate('H:i:s', $item->duration);
                                    return $item;
                                  });

        /* Calculate hoursByMonths data */
        $minMonths  = [];
        $monthlyMins = [];

        $start = Carbon::create($selectedYear);

        $yearStart = $start->copy()->startOfYear();
        $yearEnd   = $start->copy()->endOfYear();
        $monthlyMins = Activity::where('timestamp', '>=', $yearStart->format('Y-01-01 00:00:00'))
                                ->where('timestamp', '<=', $yearEnd->format('Y-12-31 23:59:59'))
                                ->where(function($query) use ($selectedApi) {
                                    if ($selectedApi > 0) $query->where('client_id', $selectedApi);
                                })
                                ->get()
                                ->map(function($item) {
                                    $item->month = Carbon::parse($item->timestamp)->format('F');
                                    return $item;
                                })
                                ->groupBy('month')
                                ->map(function($item) {
                                    $mins = 0;

                                    foreach ($item as $m) {
                                        $mins += $m->duration * 0.000277778;
                                    }

                                    return $mins;
                                });

        while ($yearStart->lt($yearEnd)) {
            $minMonths[] = $yearStart->format('F');

            $yearStart->addMonth();
        }

        $apiQuery = $selectedApi > 0?' and client_id = '.$selectedApi:'';
        /* Calculate dailyActivityByHour data */
        $dailyByHour = DB::select("SELECT DISTINCT
                                date_trunc('hour', \"timestamp\") AS hour, count(*)
                                OVER (PARTITION BY date_trunc('hour', \"timestamp\")) AS count
                                FROM activity
                                where timestamp > now() - interval '24 hour'
                                ".$apiQuery."
                                ORDER BY hour, count;");

        /* Calculate info counters */
        $membersCount  = 0;
        $averageAge    = 0;
        $maleMembers   = 0;
        $femaleMembers = 0;

        $members = Activity::with('user')->select('user_id')->where(function($query) use ($selectedApi) {
            if ($selectedApi > 0) $query->where('client_id', $selectedApi);
            })
            ->whereRaw($whereDate)
            ->groupBy('user_id')->get();

        $ageCount = 0;
        foreach ($members as $member) {
            $membersCount ++;
            if ($member->user && $member->user->age > 5) {
                if ($member->user->age > 5) {
                    $ageCount ++;
                    $averageAge += $member->user->age;
                }
                if ($member->user->gender == 0) $femaleMembers ++;
                else $maleMembers ++;
            }
        }

        $averageAge    = $ageCount == 0 ? 0:$averageAge / $ageCount;

        $data = [
            'companies'     => $apis,
            'transfers'     => $transfers,
            'years'         => $years,
            'months'        => $months,
            'info'          => [
                'total'       => number_format($membersCount),
                'age'         => number_format($averageAge, 2),
                'male'        => $maleMembers,
                'female'      => $femaleMembers,
            ],
            'issuers'       => [],
            'minMonths'     => $minMonths,
            'monthlyMins'   => $monthlyMins,
            'dailyByHour'   => $dailyByHour,
        ];

        // dd($data);

        if (request()->ajax()) {
            $data['success'] = true;

            return response()->json($data);
        } else {
            return view('dashboard.root.reports.activity', $data);
        }
    }

    /**
     * Download activity report as .csv
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function downloadActivityReport() {
        $company    = auth()->user()->company;
        $locationId = auth()->user()->location_id;

        $year            = request()->get('year');
        $month           = request()->get('month');
        $selectedApi     = request()->get('company_id');

        $whereDate = "EXTRACT(YEAR FROM activity.timestamp) = '{$year}'";
        if ($month > 0) {
            $whereDate .= " AND EXTRACT(MONTH FROM activity.timestamp) = '{$month}'";
        }

        $transactions = Activity::select('activity.id', 'activity.timestamp', 'user.fname', 'user.lname', 'activity.name', 'activity.duration', 'api.name as program')
                                  ->join('user', 'user.id', '=', 'activity.user_id')
                                  ->join('api', 'api.id', '=', 'activity.client_id')

                                  ->where(function($query) use ($selectedApi) {
                                    if ($selectedApi > 0) $query->where('activity.client_id', $selectedApi);
                                  })
                                  ->whereRaw($whereDate)
                                  ->orderBy('timestamp', 'DESC')
                                  ->get();

        $csv = fopen('php://memory', 'w');

        $header = ['Activity ID', 'Date', 'FName', 'LName', 'Activity Name', 'Duration', 'Program'];
        fputcsv($csv, $header, $company->csv_delimiter == 'comma' ? "," : "\t");

        foreach ($transactions as $transaction) {
            fputcsv($csv, [
                $transaction->id,
                $transaction->timestamp,
                $transaction->fname,
                $transaction->lname,
                $transaction->name,
                $transaction->duration,
                $transaction->program,
            ], $company->csv_delimiter == 'comma' ? "," : "\t");
        }

        header('Content-Type: application/csv');
        header('Content-Disposition: attachment; filename="Activity-Export-'.$year.'-'.$month.'.csv";');

        fseek($csv, 0);
        fpassthru($csv);
        fclose($csv);

        die();
    }

    /**
     * Download humana report as .csv
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function downloadHumanaReport() {
        $records = DB::select('select to_char(activity."timestamp", \'yyyy-mm-dd HH:MI:SS\') as "DateTime",public.user.fname as "FirstName",public.user.lname as "LastName", public.user.email as "MemberNumber",api.name as "Location", client_id as "LocationID",to_char(activity."timestamp", \'yyyy-mm-dd\') as "CreationDate",member_program.membership as "Membership" from activity
        join api on api.id = client_id
        join public.user on public.user.id = activity.user_id and public.user.company_id = 34
        join humana on humana.email = public.user.email
        join member_program on member_program.user_id =  public.user.id and member_program.program_id = 23

        group by activity."timestamp",public.user.fname,public.user.lname, public.user.email,api.name,client_id,member_program.membership;');

        $csv = fopen('php://memory', 'w');

        $header = ['Date/Time', 'First Name', 'Last Name', 'Member Number', 'Location', 'Location ID', 'Creation Date', 'Membership'];
        fputcsv($csv, $header, ",");

        foreach ($records as $r) {
            fputcsv($csv, [
                $r->DateTime,
                $r->FirstName,
                $r->LastName,
                $r->MemberNumber,
                $r->Location,
                $r->LocationID,
                $r->CreationDate,
                $r->Membership,
            ], ",");
        }

        header('Content-Type: application/csv');
        header('Content-Disposition: attachment; filename="Humana-Export-'.date('Y-m').'.csv";');

        fseek($csv, 0);
        fpassthru($csv);
        fclose($csv);

        die();
    }
}
