<?php

namespace App\Http\Controllers\Enterprise;

use DB;
use Carbon\Carbon;
use App\Models\Users\User;
use App\Models\Users\Roles;
use App\Models\Users\MemberDashboardModel;
use App\Models\Company\Location;
use App\Models\Company\MemberProgram;
use App\Models\Company\CheckinHistory;
use App\Models\Company\CompanyUserEligibilityCode;
use App\Services\BeaconFarm\EligableMember;

use App\Helpers\ImageHelper;
use App\Models\Company\Company;
use App\Transformers\Company\MembersTransformer;

class MembersController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show the members list page.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $memberRole   = Roles::where('slug', 'club_member')->first();
        $locationsIds = Location::whereCompanyId(auth()->user()->company->id)->pluck('id')->toArray();

        if (count($locationsIds)) {
            $members = CheckinHistory::whereIn('location_id', $locationsIds)
                                     ->distinct('user_id')
                                     ->orderBy('user_id', 'DESC')
                                     ->orderBy('timestamp', 'DESC')
                                     ->with('user', 'user.program')
                                     ->whereHas('user', function($query) use ($memberRole) {
                                         $query->where('role_id', $memberRole->id);
                                     })
                                     ->get()
                                     ->transformWith(new MembersTransformer())
                                     ->toArray();

            $members = array_values(collect($members)->sortByDesc('latestCheckinDate')->toArray());
        } else {
            $members = [];
        }

        $collection = collect($members);
        $total      = $collection->count();

        return view('dashboard.company.members.index', [
            'members'      => $collection->slice(0, $this->perPage),
            'pages'        => ceil($total / $this->perPage),
            'isEnterprise' => true,
        ]);
    }

    /**
     * Filter members list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $memberRole   = Roles::where('slug', 'club_member')->first();
        $locationsIds = Location::whereCompanyId(auth()->user()->company->id)->pluck('id')->toArray();

        if (count($locationsIds) && !auth()->user()->isRoot()) {
            $members = CheckinHistory::whereIn('location_id', $locationsIds)
                                     ->distinct('user_id')
                                     ->orderBy('user_id', 'DESC')
                                     ->orderBy('timestamp', 'DESC')
                                     ->with('user', 'user.program')
                                     ->whereHas('user', function($query) use ($memberRole) {
                                         $query->where('role_id', $memberRole->id);
                                     })
                                     ->get();

            if (request()->get('search')) {
                $members = $members->filter(function ($item) {
                    return stristr($item->user->display_name, request()->get('search')) || stristr($item->user->phone, request()->get('search'));
                });
            }

            $members = $members->transformWith(new MembersTransformer())->toArray();

            $members = array_values(collect($members)->sortByDesc('latestCheckinDate')->toArray());
        } elseif (auth()->user()->isRoot()) {
            $latestCheckins = CheckinHistory::whereIn('location_id', $locationsIds)
                                     ->distinct('user_id')
                                     ->orderBy('user_id', 'DESC')
                                     ->orderBy('timestamp', 'DESC')
                                     ->pluck('timestamp', 'user_id')
                                     ->toArray();

            $membersRole = Roles::where('slug', 'club_member')->first();
            $members = User::where('role_id', $membersRole->id)
                           ->with('program')
                           ->get();


            if (request()->get('search')) {
                $members = $members->filter(function ($item) {
                    return stristr($item->display_name, request()->get('search')) || stristr($item->phone, request()->get('search'));
                });
            }

            $members = $members->map(function($item) use ($latestCheckins) {
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
                               ->toArray();

            $members = array_values($members);
        } else {
            $members = [];
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $collection = collect($members);
        $total      = $collection->count();

        return response()->json([
            'success'  => true,
            'searchId' => request()->get('searchId'),
            'list'     => $collection->slice($page * $this->perPage, $this->perPage),
            'pages'    => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show the members view page.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function view($memberId)
    {
        $locations = Location::whereCompanyId(auth()->user()->company->id)
                             ->pluck('name', 'id')
                             ->toArray();

        if (count($locations) || auth()->user()->isRoot()) {
            $memberRole = Roles::where('slug', 'club_member')->first();
            $member = MemberDashboardModel::getDashboard($memberId);
        } else {
            $member = null;
        }

        if (!$member || !isset($member['member']->id)) {
            return abort(404);
        }

        return view('dashboard.company.members.view', [
            'start'        => $member['start'],
            'member'       => $member['member'],
            'checkins'     => $member['checkins'],
            'wellness'     => $member['wellness'],
            'isEnterprise' => true,
        ]);
    }

    /**
     * Show the members edit page.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($memberId)
    {
        $memberRole = Roles::where('slug', 'club_member')->first();

        if (auth()->user()->isRoot()) {
            $member = User::whereId($memberId)
                          ->where('role_id', $memberRole->id)
                          ->first();
        } else {
            $locationsIds = Location::whereCompanyId(auth()->user()->company->id)->pluck('id')->toArray();

            $member = CheckinHistory::whereIn('location_id', $locationsIds)
                                    ->whereUserId($memberId)
                                    ->distinct('user_id')
                                    ->orderBy('user_id', 'DESC')
                                    ->orderBy('timestamp', 'DESC')
                                    ->with('user', 'user.program')
                                    ->whereHas('user', function($query) use ($memberRole) {
                                        $query->where('role_id', $memberRole->id);
                                    })
                                    ->first();

            $member = $member->user ?: null;
        }

        if (!$member) {
            return abort(404);
        }

        $eligibleCode =  MemberProgram::select('membership as code')->where('user_id', $member->id)->first();
        // $eligibleCode = CompanyUserEligibilityCode::where('company_id', auth()->user()->location->company_id)
        //                                           ->where('user_id', $member->id)
        //                                           ->first();
        $companies    =  Company::select('id', 'name')->where('company_type', 1)->get();

        return view('dashboard.company.members.manage', [
            'code_required_programs' => config('app.settings.programs_code_required'),
            'isEnterprise' => true,
            'member'       => $member,
            'eligibleCode' => $eligibleCode,
            'programs'     => auth()->user()->company->programs->map(function($item) {
                return (object) [
                    'id'   => $item->program_id,
                    'name' => $item->program->name,
                ];
            }),
            'companies'    => $companies,
        ]);
    }

    /**
     * Save the member.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function save()
    {
        if (!auth()->user()->isAdmin()) {
            return abort(403);
        }

        $programIds = auth()->user()->company->programs->pluck('program_id')->toArray();

        request()->validate([
            'email'      => 'required|email',
            'first_name' => 'required|string',
            'last_name'  => 'required|string',
            'phone'      => 'nullable|string',
            'birthday'   => 'required|date_format:Y-m-d',
            'program_id' => 'required|in:0'.(count($programIds) > 0 ? ',' : '').implode(',', $programIds),
            'gender'     => 'required|in:-1,0,1',
            'avatar'     => 'nullable|string',
        ]);

        $avatar = null;
        if (request()->get('avatar') && ImageHelper::exists(request()->get('avatar')) && stripos(request()->get('avatar'), '/temp') >= 0) {
            $avatar   = true;

            if (!ImageHelper::isTempStorageImage(request()->get('avatar'))) {
                return redirect()->back()->withErrors(['avatar' => ['Only image files supported.']])->withInput();
            }
        }

        if (in_array(request()->get('program_id'), config('app.settings.programs_code_required'))) {
            $isEligible = EligableMember::check(request()->get('code'), request()->get('program_id'));

            if ($isEligible['error'] != 200) {
                return redirect()->back()->with('errorMessage', 'Valid code is required for this program')->withInput();
            }
        }

        if (request()->get('memberId')) {
            $memberRole = Roles::where('slug', 'club_member')->first();

            if (auth()->user()->isRoot()) {
                $member = User::whereId(request()->get('memberId'))
                              ->where('role_id', $memberRole->id)
                              ->first();
            } else {
                $locationsIds = Location::whereCompanyId(auth()->user()->company->id)->pluck('id')->toArray();

                $member = CheckinHistory::whereIn('location_id', $locationsIds)
                                        ->whereUserId(request()->get('memberId'))
                                        ->distinct('user_id')
                                        ->orderBy('user_id', 'DESC')
                                        ->orderBy('timestamp', 'DESC')
                                        ->with('user', 'user.program')
                                        ->whereHas('user', function($query) use ($memberRole) {
                                            $query->where('role_id', $memberRole->id);
                                        })
                                        ->first();

                $member = $member->user ?? null;
            }

            if (!$member) {
                return abort(404);
            }
        } else {
            return abort(404);

            $member = new User;
        }

        /* Check if email is free to use */
        $emailIsUsed = User::whereEmail(request()->get('email'))
                           ->where('id', '<>', request()->get('memberId'))
                           ->first();

        if ($emailIsUsed) {
            return redirect()->back()->withErrors(['email' => ['This email has already been taken.']])->withInput();
        }

        if (!request()->get('memberId')) {
            $role = Roles::where('slug', 'club_member')->first();
            $member->status      = 1;
            $member->role_id     = $role->id;
            $member->location_id = auth()->user()->location_id;
            $member->photo       = 'https://d2x5ku95bkycr3.cloudfront.net/App_Themes/Common/images/profile/0_200.png';
        } else {
            $member->status = request()->get('status') ? 1 : 0;
        }

        $member->email      = request()->get('email');
        $member->fname      = request()->get('first_name');
        $member->lname      = request()->get('last_name');
        $member->phone      = request()->get('phone');
        $member->birthday   = request()->get('birthday');
        $member->program_id = request()->get('program_id');
        $member->gender     = request()->get('gender');

        if ($avatar) {
            $path = str_replace('/temp', '', request()->get('avatar'));

            ImageHelper::moveStorageToPublic(request()->get('avatar'), $path);

            $member->photo = url($path);
        }

        $member->save();

        if (in_array(request()->get('program_id'), config('app.settings.programs_code_required'))) {
            $code = CompanyUserEligibilityCode::firstOrNew([
                'user_id'    => $member->id,
                'company_id' => auth()->user()->location->company_id,
            ]);

            $code->code = request()->get('code');
            $code->save();
        }

        return redirect(route('enterprise.members.view', ['memberId' => $member->id]))->with('successMessage', 'Your updates have been saved');
    }

    /**
     * Checkin the member.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function checkin($memberId)
    {
        request()->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $timezoneOffset = request()->get('timezoneOffset', 0);

        if (Carbon::parse(request()->get('date').' 00:00:00')->gt(Carbon::now()->setTimezone($timezoneOffset)->format('Y-m-d H:i:s'))) {
            return response()->json([
                'success' => false,
                'message' => 'You are not allowed to check-in the user in future.',
            ]);
        }

        $memberRole = Roles::where('slug', 'club_member')->first();
        $company = Company::find(auth()->user()->company->id);

        if (auth()->user()->isRoot()) {
            $member = User::whereId($memberId)
                          ->where('role_id', $memberRole->id)
                          ->first();
        } else {
            $locationsIds = Location::whereCompanyId(auth()->user()->company->id)->pluck('id')->toArray();

            $member = CheckinHistory::whereIn('location_id', $locationsIds)
                                    ->whereUserId($memberId)
                                    ->distinct('user_id')
                                    ->orderBy('user_id', 'DESC')
                                    ->orderBy('timestamp', 'DESC')
                                    ->with('user', 'user.program')
                                    ->whereHas('user', function($query) use ($memberRole) {
                                        $query->where('role_id', $memberRole->id);
                                    })
                                    ->first();

            $member = $member->user ?: null;
        }

        if (!$member) {
            return abort(404);
        }

        $alreadyCheckedIn = CheckinHistory::whereRaw("DATE(timestamp) = '".request()->get('date')."'")
                                          ->where('user_id', $member->id)
                                          ->where('location_id', auth()->user()->location_id)
                                          ->first();

        if ($company->multi_day_checkin == 1) {
            $alreadyCheckedIn = null;
        }

        if (!$alreadyCheckedIn) {
            CheckinHistory::create([
                'timestamp'   => request()->get('date').' 12:00:00',
                'user_id'     => $member->id,
                'location_id' => auth()->user()->location_id,
                'lat'         => null,
                'lng'         => null,
                'processed'   => null,
                'checkin'     => 1,
                'program_id'  => $member->program_id,
                'type'        => 0,
                'source_id'   => 2,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Member was successfuly checked in',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Member has already checked in',
        ]);
    }
}
