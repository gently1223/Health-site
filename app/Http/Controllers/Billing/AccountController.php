<?php

namespace App\Http\Controllers\Billing;

use DB;
use Carbon\Carbon;
use App\Models\Program;
use App\Models\Users\User;
use App\Models\Users\Roles;
use App\Models\Users\MemberProgram;
use App\Models\Company\Company;
use App\Models\Company\Location;
use App\Models\Company\CheckinHistory;
use App\Models\Company\CheckinLedger;
use App\Models\Company\CheckinLedgerMember;
use App\Services\Stripe\Payout;

class AccountController extends \App\Http\Controllers\Controller
{
    /**
     * Make test payout
     *
     * @return \Illuminate\Routing\Redirector
     */
    public function testPayout()
    {
        $payout = new Payout(auth()->user()->location);

        $amount = intval(request()->get('amount'));
        if ($amount > 0) {
            $payout->payout($amount);
        }

        return redirect(route('billing.account'));
    }

    /**
     * Show Stripe Pay Out settings page.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        // if (auth()->user()->location->payout_method && !auth()->user()->location->payout_method->stripe_payout_method_id) {
        //     (new Payout(auth()->user()->location))->setDefaultPayoutMethod();
        // }

        $startYear = 2021;
        $selectedYear  = request()->ajax() ? request()->get('year') : now()->format('Y');
        $selectedMonth = request()->ajax() ? request()->get('month') : now()->format('n');
        $selectedMonthFull = $startYear;

        $selectedCompany = request()->ajax() ? request()->get('company_id') : auth()->user()->location->id;

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
                'active' => $selectedMonth == 0,
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

            if ($m == $selectedMonth) {
                $selectedMonthFull = $monthName;
            }
        }

        $locationId = auth()->user()->location_id;
        $companies = Location::select('id','address')->orderBy('name', 'ASC')
                            ->where('parent_id','=',auth()->user()->location->id)
                            ->orwhere('id', '=', auth()->user()->location->id)
                            ->get()
                            ->map(function($item) use ($selectedCompany) {
                                return [
                                    'id'     => $item->id,
                                    'title'  => $item->address,
                                    'active' => $selectedCompany == $item->id,
                                ];
                            })->toArray();

       if (auth()->user()->isRoot())
        array_unshift($companies , [
            'id'     => 0,
            'title'  => 'All',
            'active' => $selectedCompany == 0,
        ]);

        $whereDate = "EXTRACT(YEAR FROM active_date) = '{$selectedYear}'";
        if ($selectedMonth > 0) {
            $whereDate .= " AND EXTRACT(MONTH FROM active_date) = '{$selectedMonth}'";
        }

        /* Get Transfers */
        $transfers = CheckinLedger::select('company.name as company','ledger.id', 'ledger.active_date', 'locations.address', 'programs.name', 'ledger.total', 'ledger.stripe_status', 'ledger.visit_count', 'ledger.visit_process_count','ledger.reimbursement', 'ledger.company_id')
                                  ->join('locations', 'locations.id', '=', 'ledger.location_id')
                                  ->join('programs', 'programs.id', '=', 'ledger.program_id')
                                 ->join('company', 'company.id', '=', 'ledger.company_id')
                                  ->where(function($query) use ($selectedCompany) {
                                    if ($selectedCompany > 0) $query->where('ledger.location_id', $selectedCompany);
                                  })
                                  ->whereRaw($whereDate)
                                  ->orderBy('active_date', 'DESC')
                                  ->get()
                                  ->map(function($item) {
                                      return (object) [
                                          'id'            => $item->id,
                                          'active_date'   => $item->active_date,
                                          'company'       => $item->company,
                                          'address'       => $item->address,
                                          'name'          => substr($item->name, 0, 20).(strlen($item->name) > 20 ? '...' : ''),
                                          'total'         => number_format($item->total, 2, '.', ''),
                                          'stripe_status' => $item->stripe_status,
                                          'status'        => $item->stripe_status == 1 ? 'PAID' : '',
                                          'visit_count'   => $item->visit_count,
                                          'visit_process_count'   => $item->visit_process_count,
                                          'reimbursement' => number_format($item->reimbursement, 2, '.', ''),
                                      ];
                                  });

        /* Calculate info counters */
        $enrolled      = 0;
        $membersCount  = 0;
        $averageAge    = 0;
        $maleMembers   = 0;
        $femaleMembers = 0;
        $checkinsByProgram = [];

        $memberRole = Roles::where('slug', 'club_member')->first();

        if ($locationId) {

            $membersCount = CheckinLedgerMember::where('location_id', $selectedCompany)->distinct()->count('member_id');

            $totalAge      = 0;
            $totalWithAge  = 0;
            $averageAge    = User::avg('age');
            $maleMembers   = User::where('gender', '=','1')->count();
            $femaleMembers = User::where('gender', '=','0')->count();

            $estimatedPayment = CheckinLedger::

                                             where('stripe_status','=', 0)
                                             ->where('location_id', $selectedCompany)
                                             ->whereRaw($whereDate)
                                             ->selectRaw("SUM(total) AS counted")
                                             ->groupBy('location_id')
                                             ->get();

            $totalEstimatedPayment = CheckinLedger::

                                             where('stripe_status','=', 0)
                                             ->where('location_id', $selectedCompany)
                                             ->selectRaw("SUM(total) AS counted")
                                             ->groupBy('location_id')
                                             ->get();

            $outstandingPayout = $totalEstimatedPayment->sum('counted') + 0.00;

            $totalPayout = $estimatedPayment->sum('counted') + 0.00;

            /* Calculate insurers counters */
            $enrolled = CheckinLedgerMember::whereRaw($whereDate)
                                           ->where('location_id', $selectedCompany)
                                           ->distinct()
                                           ->count('member_id');

            $checkinsByProgram = CheckinLedgerMember::whereRaw($whereDate)
                                                    ->where('ledger_member.location_id', $selectedCompany)
                                                    ->join('programs','programs.id', '=', 'ledger_member.program_id')
                                                    ->select('program_id as id')
                                                    ->select('name')
                                                    ->selectRaw("COUNT(program_id) AS count")
                                                    ->selectRaw("$membersCount / COUNT(program_id) AS percentage")
                                                    ->groupBy('ledger_member.program_id')
                                                    ->groupBy('programs.name')
                                                    ->get();
        if ($checkinsByProgram)
            $totalCheckins = $checkinsByProgram->sum('counted');
        else
           $totalCheckins = 0;
        }

        $data = [
            'companies'     => $companies,
            'transfers'     => $transfers,
            'years'         => $years,
            'months'        => $months,
            'info'          => [
                'total'       => number_format($membersCount),
                'age'         => number_format($averageAge, 2),
                'male'        => $maleMembers,
                'female'      => $femaleMembers,
                'totalPayout' => number_format($totalPayout),
                'outstandingPayout' => number_format($outstandingPayout),
                'selectedMonthFull' => $selectedMonthFull,
            ],
            'issuers'       => [
                'enrolled' => number_format($enrolled),
                'programs' => $checkinsByProgram,
            ],
        ];

        if (request()->ajax()) {
            $data['success'] = true;

            return response()->json($data);
        } else {
            return view('dashboard.billing.account', $data);
        }
    }

    /**
     * Redirect to stripe payout settings link.
     *
     * @return \Illuminate\Routing\Redirector
     */
    public function redirect()
    {
        return redirect((new Payout(auth()->user()->location))->redirectToAccountLink());
    }

    /**
     * Save location default payout method
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function setDefaultPayoutMethod()
    {
        $payoutMethodId = request()->get('payoutMethodId');

        $stripeAccount = (new Payout(auth()->user()->location))->setDefaultPayoutMethod($payoutMethodId);

        return response()->json([
            'success'       => true,
            'stripeAccount' => $stripeAccount,
        ]);
    }

    /**
     * Save location default payout method
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function downloadTransactions() {
        $company    = auth()->user()->company;
        $locationId = auth()->user()->location_id;

        $year            = request()->get('year');
        $month           = request()->get('month');
        $selectedCompany = request()->get('company_id');

        $whereDate = "EXTRACT(YEAR FROM active_date) = '{$year}'";
        if ($month > 0) {
            $whereDate .= " AND EXTRACT(MONTH FROM active_date) = '{$month}'";
        }

        $transactions = CheckinLedger::select('ledger.id', 'ledger.active_date', 'locations.address', 'programs.name', 'ledger.total', 'ledger.stripe_status', 'ledger.visit_count','ledger.reimbursement', 'ledger.company_id')
                                     ->join('locations', 'locations.id', '=', 'ledger.location_id')
                                     ->join('programs', 'programs.id', '=', 'ledger.program_id')
                                     ->where('ledger.location_id', $selectedCompany)
                                     ->whereRaw($whereDate)
                                     ->orderBy('active_date', 'DESC')
                                     ->get()
                                     ->map(function($item) {
                                         return (object) [
                                             'id'            => $item->id,
                                             'active_date'   => $item->active_date,
                                             'address'       => $item->address,
                                             'name'          => $item->name,
                                             'total'         => number_format($item->total, 2, '.', ''),
                                             'stripe_status' => $item->stripe_status,
                                             'status'        => $item->stripe_status == 1 ? 'PAID' : '',
                                             'visit_count'   => $item->visit_count,
                                             'reimbursement' => number_format($item->reimbursement, 2, '.', ''),
                                         ];
                                     });

        $csv = fopen('php://memory', 'w');

        $header = ['Transaction', 'Transaction Date', 'Visit Count', 'Rate', 'Location', 'Program', 'Amount', 'Status'];
        fputcsv($csv, $header, $company->csv_delimiter == 'comma' ? "," : "\t");

        foreach ($transactions as $transaction) {
            fputcsv($csv, [
                $transaction->id,
                $transaction->active_date,
                $transaction->visit_count,
                $transaction->reimbursement,
                $transaction->address,
                $transaction->name,
                '$'.$transaction->total,
                $transaction->status,
            ], $company->csv_delimiter == 'comma' ? "," : "\t");
        }

        header('Content-Type: application/csv');
        header('Content-Disposition: attachment; filename="Transactions-Export-'.$year.'-'.$month.'.txt";');

        fseek($csv, 0);
        fpassthru($csv);
        fclose($csv);

        die();
    }

    /**
     * Save location default payout method
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function downloadInsurance() {
        $company    = auth()->user()->company;
        $locationId = auth()->user()->location_id;

        $year            = request()->get('year');
        $month           = request()->get('month');
        $selectedCompany = request()->get('company_id');

        $whereDate = "EXTRACT(YEAR FROM active_date) = '{$year}'";
        if ($month > 0) {
            $whereDate .= " AND EXTRACT(MONTH FROM active_date) = '{$month}'  and total > 0";
        }

        // $insurances = DB::select("SELECT member_program.membership AS confirmation_id, TO_CHAR(active_date, 'YYYYMM') AS activity_date, visit_count, club_id
        //     FROM ledger_member
        //         JOIN member_program ON member_program.user_id = ledger_member.member_id AND member_program.program_id = ledger_member.program_id
        //          JOIN locations on locations.id = ledger_member.location_id
        //       AND $whereDate
        //     WHERE ledger_member.location_id = '{$selectedCompany}'
        // ");

         $insurances = DB::select("SELECT TRIM(member_program.membership) AS confirmation_id, TO_CHAR(active_date, 'YYYYMM') AS activity_date, visit_count, case when club_id = '-1' then NULL else club_id end
            FROM ledger_member
                JOIN member_program ON member_program.user_id = ledger_member.member_id AND member_program.program_id = ledger_member.program_id
                 JOIN locations on locations.id = ledger_member.location_id  AND $whereDate WHERE ledger_member.location_id = '{$selectedCompany}'

                 UNION

              SELECT TRIM(member_program.membership) AS confirmation_id, TO_CHAR(active_date, 'YYYYMM') AS activity_date, visit_count,
              case when club_id = '-1' then NULL else club_id end

            FROM ledger_activity_member as ledger_member
                JOIN member_program ON member_program.user_id = ledger_member.member_id AND member_program.program_id = ledger_member.program_id
                 JOIN locations on locations.id = ledger_member.location_id AND $whereDate WHERE ledger_member.location_id = '{$selectedCompany}'

        ");


        $csv = fopen('php://memory', 'w');

        $header = ['Confirmation ID', 'Activity Year & Month', 'Visit Count', 'Fitness Center Location ID', 'Fitness Center Member ID'];
        fputcsv($csv, $header, $company->csv_delimiter == 'comma' ? "," : "\t");

        foreach ($insurances as $insurance) {
            fputcsv($csv, [
                $insurance->confirmation_id,
                $insurance->activity_date,
                $insurance->visit_count,
                $insurance->club_id,
                "NULL",
            ], $company->csv_delimiter == 'comma' ? "," : "\t");
        }

        header('Content-Type: application/csv');
        header('Content-Disposition: attachment; filename="Insurance-Export-'.$year.'-'.$month.'.txt";');

        fseek($csv, 0);
        fpassthru($csv);
        fclose($csv);

        die();
    }
}
