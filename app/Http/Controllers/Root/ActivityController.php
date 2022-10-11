<?php

namespace App\Http\Controllers\Root;

use App\Models\Company\ActivityHistory;
use App\Models\Company\Location;
use App\Models\Oauth\OauthClient;
use App\Models\Users\User;

class ActivityController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show activities list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $list = ActivityHistory::orderBy('id', 'DESC')->get();

        $total = $list->count();

        return view('dashboard.root.activity.index', [
            'activities' => $list->slice(0, $this->perPage)->toArray(),
            'pages'     => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter activities list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $activities = ActivityHistory::orderBy('id', 'DESC')->get();

        if (request()->get('search')) {
            $activities = $activities->filter(function ($item) {
                return stristr($item->name, request()->get('search'));
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $activities->count();

        return response()->json([
            'success' => true,
            'list'    => $activities->slice($page * $this->perPage, $this->perPage)->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show create activity page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        $users = User::all();
        $locations = Location::all();
        $clients = OauthClient::all();

        return view('dashboard.root.activity.manage', [
            'users'            => $users,
            'locations'        => $locations,
            'clients'          => $clients,
        ]);
    }

    /**
     * Show activities edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($activityId)
    {
        $users = User::all();
        $locations = Location::all();
        $clients = OauthClient::all();

        $activity = ActivityHistory::whereId($activityId)->first();

        if (!$activity) {
            return abort(404);
        }

        return view('dashboard.root.activity.manage', [
            'activity'         => $activity,
            'users'            => $users,
            'locations'        => $locations,
            'clients'          => $clients,
        ]);
    }

    /**
     * Save activity
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function save()
    {
        $activityId = request()->has('id') ? request()->get('id') : null;

        $users = User::all();
        $locations = Location::all();

        request()->validate([
            'user_id' => 'required|in:'.implode(',', $users->pluck('id')->toArray()),
            'location_id' => 'required|in:'.implode(',', $locations->pluck('id')->toArray()),
        ]);

        if (!$activityId) {
            $activity = new ActivityHistory();
        } else {
            $activity = ActivityHistory::find($activityId);
            if (!$activity) {
                return abort(404);
            }
        }

        $activity->name = request()->get('name');
        $activity->user_id = request()->get('user_id');
        $activity->location_id = request()->get('location_id');
        $activity->lat = request()->get('lat');
        $activity->lng = request()->get('lng');
        $activity->score = request()->get('score');
        $activity->calories = request()->get('calories');
        $activity->minutes = request()->get('minutes');
        $activity->steps = request()->get('steps');
        $activity->distance = request()->get('distance');
        $activity->heart = request()->get('heart');
        $activity->duration = request()->get('duration');
        $activity->watts = request()->get('watts');
        $activity->water = request()->get('water');
        $activity->weight = request()->get('weight');
        $activity->client_id = request()->get('client_id');
        $activity->active = request()->has('active') ? 1 : 0;
        $activity->save();

        return redirect(route('root.activity'))->with('successMessage', 'Your updates have been saved');
    }
}
