<?php

namespace App\Http\Controllers\Root;

use App\Models\Challenge;
use App\Models\ChallengeType;

class ChallengeController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show challenges list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $list = Challenge::orderBy('id', 'DESC')->get();

        $total = $list->count();

        return view('dashboard.root.challenges.index', [
            'challenges' => $list->slice(0, $this->perPage)->toArray(),
            'pages'     => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter challenges list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $challenges = Challenge::orderBy('id', 'DESC')->get();

        if (request()->get('search')) {
            $challenges = $challenges->filter(function ($item) {
                return  stristr($item->title, request()->get('search')) ||
                        stristr($item->subtitle, request()->get('search'));
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $challenges->count();

        return response()->json([
            'success' => true,
            'list'    => $challenges->slice($page * $this->perPage, $this->perPage)->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show create challenge page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        $types = ChallengeType::all();

        return view('dashboard.root.challenges.manage', [
            'types'        => $types,
        ]);
    }

    /**
     * Show challenges edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($challengeId)
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        $challenge = Challenge::whereId($challengeId)->first();
        $types = ChallengeType::all();

        if (!$challenge) {
            return abort(404);
        }

        return view('dashboard.root.challenges.manage', [
            'challenge'           => $challenge,
            'types'               => $types,
        ]);
    }

    /**
     * Save challenge
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function save()
    {
        $challengeId = request()->has('id') ? request()->get('id') : null;

        if (!$challengeId) {
            $challenge = new Challenge();
        } else {
            $challenge = Challenge::find($challengeId);
            if (!$challenge) {
                return abort(404);
            }
        }

        $challenge->title = request()->get('title');
        $challenge->subtitle = request()->get('subtitle');
        $challenge->distance = request()->get('distance');
        $challenge->start_date = request()->get('start_date');
        $challenge->end_date = request()->get('end_date');
        $challenge->photo = request()->get('photo');
        $challenge->type_id = request()->get('type_id');
        $challenge->desc = request()->get('desc');
        $challenge->price = request()->get('price');
        $challenge->steps = request()->get('steps');
        $challenge->duration = request()->get('duration');
        $challenge->calories = request()->get('calories');
        $challenge->medal_url = request()->get('medal_url');
        $challenge->active = request()->has('active') ? 1 : 0;
        $challenge->save();

        return redirect(route('root.challenges'))->with('successMessage', 'Your updates have been saved');
    }
}
