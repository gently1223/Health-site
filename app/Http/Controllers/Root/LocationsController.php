<?php

namespace App\Http\Controllers\Root;

use App\Models\Company\Location;

use App\Transformers\Company\LocationsTransformer;

use Illuminate\Support\Facades\Cache;

class LocationsController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show locations list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        Cache::put('latestLocationsList', 'root');

        $list = Location::where('provisioned', 0)
                        ->orderBy('id', 'DESC')
                        ->get();

        $total = $list->count();

        return view('dashboard.root.locations.index', [
            'locations' => $list->slice(0, $this->perPage)->transformWith(new LocationsTransformer(true))->toArray(),
            'pages'     => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter locations list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $locations = Location::where('provisioned', request()->get('provisioned') == 1 ? '>' : '=', 0)
                             ->orderBy('id', 'DESC')
                             ->get();

        if (request()->get('search')) {
            $locations = $locations->filter(function ($item) {
                return stristr($item->name.' '.$item->address, request()->get('search')) ||
                       stristr($item->state.' '.$item->city.' '.$item->address, request()->get('search')) ||
                       stristr($item->phone, request()->get('search')) ||
                       stristr($item->id, request()->get('search'));
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $locations->count();

        return response()->json([
            'success' => true,
            'list'    => $locations->slice($page * $this->perPage, $this->perPage)->transformWith(new LocationsTransformer(true))->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }
}
