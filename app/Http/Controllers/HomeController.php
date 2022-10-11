<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Users\User;
use App\Models\Users\Roles;
use App\Models\Company\Company;
use App\Models\Company\Location;
use App\Models\Company\CheckinHistory;
use App\Models\Company\CheckinLedger;
use App\Models\Company\CheckinLedgerDetail;
use App\Models\Company\Notifications;
use App\Models\Company\CheckinLedgerMember;
use App\Services\Stripe\Promocode;
use App\Transformers\Company\MembersFromLedgerDetailTransformer;

class HomeController extends Controller
{
    protected $perPage = 15;

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        if (auth()->check()) {
            $months          = [];
            $programs        = [];
            $transfers       = [];
            $checkinsCount   = [];
            $monthlyCheckins = [];

            if (auth()->user()->isAdmin() || auth()->user()->isInsurance()|| auth()->user()->isVendor() || auth()->user()->isCorporate()) {
                $company = auth()->user()->company;

                if ($company) {
                    $programs = $company->programs->sortBy('id')->values();
                    $rates    = $programs->pluck('rate', 'program_id')->toArray();

                    $start = Carbon::parse('first day of this month');
                    $end   = Carbon::parse('last day of this month');

                    $checkinsCount = 0;

                    $yearStart = $start->copy()->startOfYear();
                    $yearEnd   = $start->copy()->endOfYear();

                    $monthlyCheckins = CheckinLedger::where(function ($query) use ($company) {

                                                       if (auth()->user()->role->slug == 'corp_wellness')
                                                         $query->where('ledger.company_id','=', auth()->user()->company_id);
                                                        else
                                                         $query->where('ledger.location_id','=', auth()->user()->location_id);

                                                        if ($company->compressed) {
                                                            $query->orwhere('ledger.parent_id', '=', auth()->user()->location_id);
                                                        }
                                                    })
                                                    ->where('active_date', '>=', $yearStart->format('Y-01-01 00:00:00'))
                                                    ->where('active_date', '<=', $yearEnd->format('Y-12-31 23:59:59'))
                                                    ->get()
                                                    ->map(function($item) {
                                                        $item->month = Carbon::parse($item->active_date)->format('F');

                                                        return $item;
                                                    })
                                                    ->groupBy('month')
                                                    ->map(function($item) use ($rates) {
                                                        $revenue = 0;
                                                        $count = 0;

                                                        foreach ($item as $checkin) {
                                                            $revenue += $checkin->total;
                                                            $count += $checkin->visit_count;
                                                        }

                                                        return [
                                                            'count'   => $count,
                                                            'revenue' => $revenue,
                                                        ];
                                                    });


                    while ($yearStart->lt($yearEnd)) {
                        $months[] = $yearStart->format('F');

                        $yearStart->addMonth();
                    }
                }

                 $transfers = CheckinLedger::select('ledger.id','ledger.active_date','company.name as company','locations.address','programs.name','ledger.total','ledger.stripe_status', 'ledger.visit_count')
                                          ->where(function ($query) use ($company) {

                                              if (auth()->user()->role->slug == 'corp_wellness')
                                               $query->where('ledger.company_id','=', auth()->user()->company_id);
                                              else
                                               $query->where('ledger.location_id','=', auth()->user()->location_id);


                                              if ($company->compressed) {
                                                  $query->orwhere('ledger.parent_id', '=', auth()->user()->location_id);
                                              }
                                          })
                                          ->join('locations','locations.id', '=', 'ledger.location_id')
                                          ->join('programs','programs.id', '=', 'ledger.program_id')
                                          ->join('company', 'company.id', '=', 'ledger.company_id')
                                          ->orderBy('active_date', 'DESC')
                                          ->limit(5)
                                          ->get();

                 $totalPayout = 0;
                 $estimatedPayment = CheckinLedger::where(function ($query) use ($company) {

                                             if (auth()->user()->role->slug == 'corp_wellness')
                                               $query->where('ledger.company_id','=', auth()->user()->company_id);
                                              else
                                               $query->where('ledger.location_id','=', auth()->user()->location_id);

                                              // $query->where('ledger.location_id','=', auth()->user()->location_id);

                                                      if ($company->compressed) {
                                                          $query->orwhere('ledger.parent_id', '=', auth()->user()->location_id);
                                                      }
                                                  })
                                                  ->where('stripe_status', 0)
                                                  ->selectRaw("SUM(total) AS counted")
                                                  ->groupBy('location_id')
                                                  ->get();

                $totalPayout = $estimatedPayment->sum('counted') + 0.00;

                $notification =  Notifications::limit(1)->where('start_date', '<=', date("Y-m-d H:i:s"))->where('end_date', '>=', date("Y-m-d H:i:s"))->get();

        $enrolled      = 0;
        $membersCount  = 0;
        $averageAge    = 0;
        $maleMembers   = 0;
        $femaleMembers = 0;
        $totalAge      = 0;
         $totalWithAge  = 0;
        $outstandingPayout = 0;
        $checkinsByProgram = [];

        $startYear = 2021;
        $selectedYear  = request()->ajax() ? request()->get('year') : now()->format('Y');
        $selectedMonth = request()->ajax() ? request()->get('month') : now()->format('n');
        $selectedMonthFull = $startYear;

         $locationId = auth()->user()->location_id;


        $whereDate = "EXTRACT(YEAR FROM active_date) = '{$selectedYear}'";
        if ($selectedMonth > 0) {
            $whereDate .= " AND EXTRACT(MONTH FROM active_date) = '{$selectedMonth}'";
        }

        $enrolled = CheckinLedgerMember::where(function ($query) use ($locationId, $company) {
                                               $query->where('ledger_member.location_id','=', $locationId);

                                               if ($company->compressed) {
                                                   $query->orwhere('ledger_member.parent_id', '=', $locationId);
                                               }
                                           })
                                           ->whereRaw($whereDate)
                                           ->distinct()
                                           ->count('member_id');

        $checkinsByProgram = CheckinLedgerMember::where(function ($query) use ($locationId, $company) {
                                                $query->where('ledger_member.location_id','=', $locationId);

                                                if ($company->compressed) {
                                                    $query->orwhere('ledger_member.parent_id', '=', $locationId);
                                                }
                                            })
                                            ->whereRaw($whereDate)
                                            ->join('programs','programs.id', '=', 'ledger_member.program_id')
                                            ->select('program_id as id')
                                            ->select('name')
                                            ->selectRaw("COUNT(program_id) AS count")
                                            ->selectRaw("$membersCount / COUNT(program_id) AS percentage")
                                            ->groupBy('ledger_member.program_id')
                                            ->groupBy('programs.name')
                                            ->get();

                return view('dashboard.index', [
                    'info'          => [
                                        'total'       => number_format($membersCount),
                                        'age'         => $averageAge,
                                        'male'        => $maleMembers,
                                        'female'      => $femaleMembers,
                                        'totalPayout' => number_format($totalPayout),
                                        'outstandingPayout' => number_format($outstandingPayout),
                                    ],
                    'issuers'       => [
                                        'enrolled' => number_format($enrolled),
                                        'programs' => $checkinsByProgram,
                                    ],

                    'months'          => $months,
                    'programs'        => $programs,
                    'transfers'       => $transfers,
                    'checkinsCount'   => $checkinsCount,
                    'monthlyCheckins' => $monthlyCheckins,
                    'notifications'   => $notification,
                    'totalPayout'   => number_format($totalPayout),

                ]);
            } elseif (auth()->user()->isEmployee()) {
                return redirect(route('club.members'));
            // } elseif (auth()->user()->isInsurance()) {
            //     return redirect(route('enterprise.billing.account'));
            } elseif (auth()->user()->isMember()) {
                return redirect(route('member.dasbhoard'));
            }

            return abort(403);
        }

        return redirect('login');
    }

    /**
     * Logout
     *
     * @return \Illuminate\Routing\Redirector
     */
    public function logout()
    {
        if (auth()->check()) {
            auth()->logout();
        }

        return redirect('/');
    }

    /**
     * Check if user exists by email
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkUserExists()
    {
        if (request()->get('email')) {
            $disableRole = Roles::where('slug', 'club_member')->first();

            $user = User::where('email', request()->get('email'))
                        ->where('role_id', '!=', $disableRole->id)
                        ->first();

            if ($user) {
                return response()->json([
                    'success' => true,
                    'avatar'  => $user->photo,
                ]);
            }
        }

        return response()->json([
            'success' => false,
        ]);
    }

    /**
     * Find company by name
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function findCompany()
    {
        if (request()->get('search')) {
            $search    = request()->get('search');
            $companies = Company::where('name', 'ILIKE', '%'.strtolower($search).'%')
                                ->orderBy('name', 'ASC')
                                ->limit(5)
                                ->get()
                                ->map(function($item) {
                                    return [
                                        'id'   => $item->id,
                                        'name' => $item->name,
                                        'domain' => $item->domain
                                    ];
                                });

            return response()->json([
                'success'   => true,
                'companies' => $companies,
            ]);
        }

        return response()->json([
            'success'   => false,
            'companies' => [],
        ]);
    }

    /**
     * Search members across all platform on main dashboard page
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function findMembers()
    {
        $memberRole   = Roles::where('slug', 'club_member')->first();
        $locationsIds = Location::whereCompanyId(auth()->user()->company->id)->pluck('id')->toArray();

        $search = strtolower(request()->get('search'));

        if ($search) {
            $latestCheckins = CheckinHistory::whereIn('location_id', $locationsIds)
                                     ->distinct('user_id')
                                     ->orderBy('user_id', 'DESC')
                                     ->orderBy('timestamp', 'DESC')
                                     ->pluck('timestamp', 'user_id')
                                     ->toArray();

            $members = User::with('program')
                           ->where('role_id', $memberRole->id)
                           ->whereRaw("TRIM(LOWER(CONCAT(fname, ' ', lname))) LIKE '%{$search}%'")
                           ->get()
                           ->map(function($item) use ($latestCheckins) {
                               return [
                                   'id'                => $item->id,
                                   'photo'             => $item->photo,
                                   'displayName'       => $item->display_name,
                                   'isEligible'        => $item->isEligible() ? true : false,
                                   'latestCheckin'     => isset($latestCheckins[$item->id]) ? Carbon::parse($latestCheckins[$item->id])->format('m/d/Y h:ia') : null,
                                   'latestCheckinDate' => isset($latestCheckins[$item->id]) ? Carbon::parse($latestCheckins[$item->id]) : null,
                                   'program'           => $item->program->name,
                               ];
                           })
                           ->sortByDesc('id')
                           ->sortByDesc('latestCheckinDate')
                           ->values()
                           ->toArray();

            return response()->json([
                'success' => true,
                'members' => $members,
            ]);
        }

        return response()->json([
            'success' => true,
            'members' => [],
        ]);
    }

    /**
     * Verify Promocode
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyPromocode($verifyCode, $verifyEmail)
    {
        return response()->json((new Promocode)->get(request()->get('promocode'))->getRegistrationFeesDiscounted());
    }

    /**
     * Show the checkin members list page.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */

    //$startDate = "active_date >= '" . $ledger->active_date . "'";
    public function checkinMembers($ledgerId)
    {
        $ledger = CheckinLedger::find($ledgerId);

        $startDate = "active_date >= '" . $ledger->active_date . "'";

        $list = CheckinLedgerDetail::with('user', 'program')
                                    // ->where('active_date', $ledger->active_date)
                                    ->whereRaw($startDate )
                                    ->where('location_id', $ledger->location_id)
                                    ->orderBy('active_date', 'DESC')
                                    ->get();
        $total = $list->count();

        return view('dashboard.checkin_members', [
            'members'      => $list->slice(0, $this->perPage)->transformWith(new MembersFromLedgerDetailTransformer())->toArray(),
            'pages'        => ceil($total / $this->perPage),
            'ledgerId'     => $ledgerId
        ]);
    }

    public function checkinMemberSearch($ledgerId)
    {
        $ledger = CheckinLedger::find($ledgerId);

        $list = CheckinLedgerDetail::with('user', 'program')
                                    // ->where('active_date', $ledger->active_date)
                                    ->where('location_id', $ledger->location_id)
                                    // ->orderBy('active_date', 'DESC')
                                    ->get();

        if (request()->get('search')) {
            $list = $list->filter(function ($item) {
                return stristr($item->user->display_name, request()->get('search'));
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $list->count();

        return response()->json([
            'success' => true,
            'searchId' => request()->get('searchId'),
            'list'    => $list->slice($page * $this->perPage, $this->perPage)->transformWith(new MembersFromLedgerDetailTransformer())->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }
}
