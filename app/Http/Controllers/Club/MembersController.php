<?php

namespace App\Http\Controllers\Club;

use DB;
use Carbon\Carbon;
use App\Models\Users\User;
use App\Models\Users\Roles;
use App\Models\Users\MemberDashboardModel;
use App\Models\Company\Location;
use App\Models\Company\MemberProgram;
use App\Models\Company\CheckinHistory;
use App\Models\Company\ActivityHistory;
use App\Models\Company\CompanyProgram;
use App\Models\Company\Company;
use App\Models\Company\CompanyUserEligibilityCode;
use App\Services\BeaconFarm\EligableMember;

use App\Helpers\ImageHelper;
use App\Transformers\Company\MembersTransformer;
use App\Transformers\Company\MembersFromUserTransformer;

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
        $memberRole = Roles::where('slug', 'club_member')->first();
        $locationId = auth()->user()->location_id;

        if ($locationId) {
            $members = CheckinHistory::where('location_id', $locationId)
                                     ->has('user')
                                     ->distinct('user_id')
                                     ->orderBy('user_id', 'DESC')
                                     ->orderBy('timestamp', 'DESC')
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
            'isEnterprise' => false,
        ]);
    }

    /**
     * Filter members list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $memberRole = Roles::where('slug', 'club_member')->first();
        $locationId = auth()->user()->location_id;

        $members = User::with('program')->where('role_id', $memberRole->id);

        if (request()->get('search')) {
            $members = $members->where(function($query) {
                $query->where(DB::raw("LOWER(CONCAT(fname, ' ', lname))"), 'LIKE', '%'.strtolower(request()->get('search')).'%')
                      ->orWhere('phone', 'LIKE', '%'.request()->get('search').'%')
                      ->orWhere('email', 'LIKE', '%'.request()->get('search').'%');
            });
        }

        $members = $members->get()->transformWith(new MembersFromUserTransformer())->toArray();
        $collection = collect($members);

        $total = $collection->count();
        $page  = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

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
        $member = MemberDashboardModel::getDashboard($memberId);

        if (!isset($member['member']->id)) {
            return abort(404);
        }

        /* Get User Wellness Data */

        return view('dashboard.company.members.view', [
            'start'        => $member['start'],
            'member'       => $member['member'],
            'checkins'     => $member['checkins'],
            'wellness'     => $member['wellness'],
            'usage'        => $member['usage'],
            'isEnterprise' => false,
        ]);
    }

    /**
     * Show the members create page.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        $memberRole = Roles::where('slug', 'club_member')->first();
        $companies    =  Company::select('id', 'name')->where('company_type', 1)->get();

        return view('dashboard.company.members.manage', [
            'code_required_programs' => config('app.settings.programs_code_required'),
            'isEnterprise' => false,
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
     * Show the members edit page.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($memberId)
    {
        $memberRole = Roles::where('slug', 'club_member')->first();
        $locationId = auth()->user()->location_id;

        if ($locationId) {
            $member = User::whereId($memberId)
                          ->where('role_id', $memberRole->id)
                          ->first();
        } else {
            $member = null;
        }

        if (!$member) {
            return abort(404);
        }

        $eligibleCode =  MemberProgram::select('membership as code')->where('user_id', $member->id)->first();
        $companies    =  Company::select('id', 'name')->where('company_type', 1)->get();

        return view('dashboard.company.members.manage', [
            'code_required_programs' => config('app.settings.programs_code_required'),
            'isEnterprise' => false,
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

        $validate = [
            'email'      => 'required|email',
            'first_name' => 'required|string',
            'last_name'  => 'required|string',
            'phone'      => 'nullable|string',
            'company_id' => 'nullable|string',
            'birthday'   => 'required|date_format:Y-m-d',
            'program_id' => 'required|in:0'.(count($programIds) > 0 ? ',' : '').implode(',', $programIds),
            'gender'     => 'required|in:-1,0,1',
            'avatar'     => 'nullable|string',
        ];

        $avatar = null;
        if (request()->get('avatar') && ImageHelper::exists(request()->get('avatar')) && stripos(request()->get('avatar'), '/temp') >= 0) {
            $avatar   = true;

            if (!ImageHelper::isTempStorageImage(request()->get('avatar'))) {
                return redirect()->back()->withErrors(['avatar' => ['Only image files supported.']])->withInput();
            }
        }

        if (!request()->get('memberId')) {
            $validate['password'] = 'required|string|max:255|min:6|confirmed';
        }

        if (in_array(request()->get('program_id'), config('app.settings.programs_code_required'))) {
            $isEligible = EligableMember::check(request()->get('code'), request()->get('program_id'));

            if ($isEligible['error'] != 200) {
                return redirect()->back()->with('errorMessage', $isEligible['message'])->withInput();
            }
        }

        request()->validate($validate);

        $memberRole = Roles::where('slug', 'club_member')->first();
        if (request()->get('memberId')) {
            $locationId = auth()->user()->location_id;

            if ($locationId) {
                $member = User::whereId(request()->get('memberId'))
                              ->where('role_id', $memberRole->id)
                              ->first();
            } else {
                $member = null;
            }

            if (!$member) {
                return abort(404);
            }
        } else {
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
            $member->status      = 1;
            $member->role_id     = $memberRole->id;
            $member->location_id = auth()->user()->location_id;
            $member->photo       = 'https://d2x5ku95bkycr3.cloudfront.net/App_Themes/Common/images/profile/0_200.png';
            $member->password    = request()->get('password');
        } else {
            $member->status = request()->get('status') ? 1 : 0;
        }

        $member->email      = request()->get('email');
        $member->fname      = request()->get('first_name');
        $member->lname      = request()->get('last_name');
        $member->phone      = request()->get('phone');
        $member->company_id = request()->get('company_id');
        $member->birthday   = request()->get('birthday');
        $member->program_id = request()->get('program_id') ?? 0;
        $member->gender     = request()->get('gender');
        $member->password   = request()->get('password');
        $member->eligibility_status = "Eligible";

        if ($avatar) {
            $path = str_replace('/temp', '', request()->get('avatar'));

            ImageHelper::moveStorageToPublic(request()->get('avatar'), $path);

            $member->photo = url($path);
        }

        $member->save();

        // Delete old prgrams with type = 1
        MemberProgram::whereUserId($member->id)->delete();
        if (request()->get('program_id')) {
            $memberProgram             = new MemberProgram();
            $memberProgram->user_id    = $member->id;
            $memberProgram->program_id = request()->get('program_id') ?? 0;
            $memberProgram->membership = request()->get('code') ?? '';
            $memberProgram->status = 1;
            $memberProgram->save();
        }

        return redirect(route('club.members.view', ['memberId' => $member->id]))->with('successMessage', 'Your updates have been saved');
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

        if (!auth()->user()->isEmployee()) {
            return abort(403);
        }

        $timezoneOffset = request()->get('timezoneOffset', 0);

        if (Carbon::parse(request()->get('date').' 00:00:00')->gt(Carbon::now()->setTimezone($timezoneOffset)->format('Y-m-d H:i:s'))) {
            return response()->json([
                'success' => false,
                'message' => 'You are not allowed to check-in the user in future.',
            ]);
        }
        $company = Company::find(auth()->user()->company->id);
        $locationId = auth()->user()->location_id;
        $memberRole = Roles::where('slug', 'club_member')->first();

        $member = User::whereId($memberId)
                      ->where('role_id', $memberRole->id)
                      ->first();

        if (!$member) {
            return abort(404);
        }

        // If the member program is not in the list reject
        $memberProgram = MemberProgram::where('user_id', $memberId)->first();
        if (!$memberProgram) {
            return response()->json([
                'success' => false,
                'message' => 'Member has no valid program',
            ]);
        }

        $program = $memberProgram->program_id;
        if ($memberProgram && in_array($memberProgram->program_id, config('app.settings.programs_code_required'))) {
            $isEligible = EligableMember::verifyOptumEligibility($locationId, $memberProgram->program_id, $memberId, $memberProgram->membership);

            if (!$isEligible['code'] == 200) {
                return response()->json([
                    'success' => false,
                    'message' => $isEligible['message'],
                ]);
            }
        }

        $alreadyCheckedIn = CheckinHistory::whereRaw("DATE(timestamp) = '".request()->get('date')."'")
                                          ->where('user_id', $member->id)
                                          ->where('location_id', $locationId)
                                          ->first();

        if ($company->multi_day_checkin == 1) {
            $alreadyCheckedIn = null;
        }

        // does the company exist
        $companyProgram = CompanyProgram::where('location_id', $locationId)->where('status', 1)->where('program_id', $program)->first();

        if (!$companyProgram){
            return response()->json([
                'success' => false,
                'message' => 'This facilites does not support this program',
            ]);
        }

        if (!$alreadyCheckedIn) {
            CheckinHistory::create([
                'timestamp'   => request()->get('date') . " ". date("H:i:s"),
                'user_id'     => $member->id,
                'location_id' => $locationId,
                'lat'         => null,
                'lng'         => null,
                'processed'   => null,
                'checkin'     => 1,
                'program_id'  => $program ? $program : 0,
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

    /**
     * Checkin the member.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function verifyCode()
    {
        $isEligible = EligableMember::check(request()->get('code'), request()->get('program_id'));

        return response()->json([
            'success' => $isEligible['error'] == 200 && $isEligible['eligible'],
            'message' => $isEligible['message'],
        ]);
    }
}
