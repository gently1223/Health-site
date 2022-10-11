<?php

namespace App\Http\Controllers\Club;

use DB;
use App\Models\Company\Location;
use App\Transformers\Club\CheckinsTransformer;

class CheckinsController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $locationsIds = [auth()->user()->location_id];

        $collection = collect([]);
        if (count($locationsIds)) {
            $list = DB::select('SELECT public.user.id, public.user.membership AS memberid, public.user.birthday, lname, fname, "timestamp", franchise as gym_pk,
                    locations."name", locations.address, locations.city, locations."state", locations.postal,
                    programs.name AS program
                FROM public.user
                    JOIN checkin_history ON checkin_history.user_id = public.user.id
                    LEFT JOIN locations ON locations.id = checkin_history.location_id
                    LEFT JOIN programs ON programs.id = public.user.program_id
                    WHERE checkin_history.location_id IN ('. implode(',', $locationsIds) .')
                    ORDER BY "timestamp" DESC
            ');

            $collection = collect($list);
        }

        $total = $collection->count();

        return view('dashboard.club.checkins', [
            'list'  => $collection->slice(0, $this->perPage)->transformWith(new CheckinsTransformer())->toArray(),
            'pages' => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter members list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        if (auth()->user()->isAdmin()) {
            $locationsIds = Location::whereCompanyId(auth()->user()->company->id)->pluck('id')->toArray();
        } else {
            $locationsIds = [auth()->user()->location_id];
        }

        $collection = collect([]);
        if (count($locationsIds)) {
            $list = DB::select('SELECT public.user.id, public.user.membership AS memberid, public.user.birthday, lname, fname, "timestamp", franchise as gym_pk,
                    locations."name", locations.address, locations.city, locations."state", locations.postal,
                    programs.name AS program
                FROM public.user
                    JOIN checkin_history ON checkin_history.user_id = public.user.id
                    LEFT JOIN locations ON locations.id = checkin_history.location_id
                    LEFT JOIN programs ON programs.id = public.user.program_id
                    WHERE checkin_history.location_id IN ('. implode(',', $locationsIds) .')
                    ORDER BY "timestamp" DESC
            ');

            $collection = collect($list);
        }

        if (request()->get('search')) {
            $collection = $collection->filter(function ($item) {
                return stristr($item->fname.' '.$item->lname, request()->get('search')) ||
                       stristr($item->memberid, request()->get('search')) ||
                       stristr($item->program, request()->get('search')) ||
                       stristr($item->name, request()->get('search')) ||
                       stristr($item->state.' '.$item->city.' '.$item->postal.' '.$item->address, request()->get('search'));
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        return response()->json([
            'success' => true,
            'pages'   => ceil($collection->count() / $this->perPage),
            'list'    => $collection->slice($page * $this->perPage, $this->perPage)->transformWith(new CheckinsTransformer())->toArray(),
        ]);
    }
}
