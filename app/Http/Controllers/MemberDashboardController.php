<?php

namespace App\Http\Controllers;

use App\Services\Integrations\MyWellness;
use App\Models\Integration\IntegrationCredential;
use App\Models\Users\MemberDashboardModel;

class MemberDashboardController extends Controller
{

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $member = MemberDashboardModel::getDashboard(auth()->user()->id);

        return view('dashboard.company.members.view', [
            'member'       => $member['member'],
            'checkins'     => $member['checkins'],
            'start'        => $member['start'],
            'wellness'     => $member['wellness'],
            'usage'        => $member['usage'],
            'isEnterprise' => true,
        ]);
    }

    /**
     * Redirect to MyWellness oauth page
     * @param int $memberId
     * @return RedirectResponse
     */
    public function redirectToMyWellness($memberId)
    {
        $myWellness = new MyWellness;

        session()->put('mywellnessOauthMemberId', $memberId);

        return redirect($myWellness->getOauthLink());
    }

    /**
     * Save member MyWellness Token
     * @return RedirectResponse
     */
    public function saveMemberMyWellnessToken()
    {
        $code     = request()->get('code');
        $memberId = session()->get('mywellnessOauthMemberId');

        if ($code) {
            $myWellness = new MyWellness;

            $token = $myWellness->getUserAccessToken($code, $memberId);
        } else {
            return redirect(route('connect.account.mywellness.error'));
        }

        if (session()->has('mywellnessConnectFromApplication')) {
            session()->flush('mywellnessConnectFromApplication');

            return redirect(route('connect.account.mywellness.success'));
        }

        return redirect(route('club.members.view', $memberId));
    }

    /**
     * Revoke member MyWellness Token
     * @param int $memberId
     * @return RedirectResponse
     */
    public function revokeMyWellnessAccess($memberId)
    {
        $token = IntegrationCredential::where('user_id', $memberId)
                                      ->where('provider', 'mywellness')
                                      ->first();

        if ($token) {
            $token->revoke();
        }

        return redirect(route('club.members.view', $memberId));
    }
}
