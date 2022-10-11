<?php

namespace App\Http\Controllers;

use App\Services\Integrations\OuraClient;
use Bugsnag\BugsnagLaravel\Facades\Bugsnag;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use RuntimeException;

class TestController extends Controller
{
    public function bugsnag()
    {
        Bugsnag::notifyException(new RuntimeException("Testing Bugsnag Slack channel."));

        echo 'Make sure Bugsnag is working: Test error sent.';
        die();
    }

    public function testSlackProvisioning()
    {
        \App\Services\Slack::sendCurlNotification('provisioning', 'TESTING: New location registered for *COMPANY* brand - *LOCATION* (ADDRESS, CITY, STATE POSTAL).');
    }

    public function playground(Request $request)
    {
        $oura = new OuraClient(1);

        try {
            $res = $oura->getActivity();

            return response()->json(['success' => true, 'data' => $res]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()]);
        }

    }
}
