<?php

namespace App\Http\Controllers\Corporate;

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

class RewardController extends \App\Http\Controllers\Controller
{
 /**
     * Instantiate a new ClubProgramsController instance.
     */
    public function __construct()
    {
     
    }

    /**
     * Show programs list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        return view('dashboard.corporate.reward.index', [
            
        ]);
    }

 
   
}
