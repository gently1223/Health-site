<?php

namespace App\Http\Controllers;

use App\Services\Integrations\MyWellness;

class ConnectController extends Controller
{
    /**
     * Connect MyWellness via Application
     * @return \Illuminate\Http\RedirectResponse
     */
    public function mywellness()
    {
        $memberId = request()->get('connectTo');

        if (!$memberId) {
            return view('dashboard.connectDevice', ['message' => 'The \'connectTo\' param is required.']);
        }

        $myWellness = new MyWellness;

        session()->put('mywellnessOauthMemberId', $memberId);
        session()->put('mywellnessConnectFromApplication', true);

        return redirect($myWellness->getOauthLink());
    }

    /**
     * Connect MyWellness via Application
     * @return \Illuminate\Http\RedirectResponse
     */
    public function mywellnessSuccess()
    {
        return view('dashboard.connectDevice', ['message' => 'Your MyWellness account was successfully connected.']);
    }

    /**
     * Connect MyWellness via Application
     * @return \Illuminate\Http\RedirectResponse
     */
    public function mywellnessError()
    {
        return view('dashboard.connectDevice', ['message' => 'Oops... Something went wrong. Account wasn\'t connected.']);
    }
}
