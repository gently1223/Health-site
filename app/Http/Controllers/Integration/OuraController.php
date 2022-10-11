<?php

namespace App\Http\Controllers\Integration;

use App\Http\Controllers\Controller;
use App\Models\Statistics\Activity;
use App\Services\Integrations\Oura\OuraClient;
use App\Services\Integrations\Oura\OuraService;
use Carbon\Carbon;
use http\Env\Response;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;

class OuraController extends Controller
{

    /**
     * http://local-vt.com/integration/ouraring/auth
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function auth(Request $request)
    {
        $memberId = request()->get('connectTo', null);
        if (!$memberId) {
            $memberId = request()->get('memberId', 0);
        }

        if (!$memberId) {
            return response()->view('integration.response', ['message' => 'The memberId or connectTo field is required.'], 422);
        }

        $provider = new OuraClient($memberId);

        return redirect()->away($provider->getOauthLink());
    }

    public function callback(Request $request)
    {
        $provider = new OuraClient();
        $provider->validateState($request->state);

        try {
            $access = $provider->getAccessToken($request->code);

            response()->json(['success' => true, 'access' => $access]);

            return response()->view('integration.response', ['message' => 'Successfully connected!']);
        } catch (\Exception $e) {
            return response()->view('integration.response', ['message' => $e->getMessage()], 400);
        }
    }

    public function profile(Request $request)
    {
        $memberId = request()->get('connectTo', null);
        if (!$memberId) {
            $memberId = request()->get('memberId', null);
        }

        $validator = Validator::make(['connectTo' => $memberId], [
            'connectTo' => 'required|numeric'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        try {
            $oura = new OuraClient($memberId);
            $profile = $oura->getProfile();

            return response()->json(['success' => true, 'data' => $profile]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()]);
        }
    }


    public function importData(Request $request)
    {
        $memberId = request()->get('connectTo', null);
        if (!$memberId) {
            $memberId = request()->get('memberId', null);
        }

        $validator = Validator::make(['connectTo' => $memberId], [
            'connectTo' => 'required|numeric'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        OuraService::importActivity($memberId);

        return response()->json(['success' => true]);
    }
}
