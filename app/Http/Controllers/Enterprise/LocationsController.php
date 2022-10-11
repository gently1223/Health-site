<?php

namespace App\Http\Controllers\Enterprise;

use App\Models\Company\Location;
use App\Models\Company\Enterprise;
use App\Transformers\Company\LocationsTransformer;
use Illuminate\Support\Facades\Cache;
use Mapper;
use DB;

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
        $company = auth()->user()->company;

        $list = collect([]);

        // HAVE TO FIX!!!
        if (auth()->user()->isRoot()) {
            $list = Location::orderBy('id', 'DESC')
                            ->get();
        } else if (auth()->user()->isInsurance()) {
            $list =  Location::orderBy('id', 'DESC')

                     ->orderBy('locations.id', 'DESC')
                     ->where('locations.company_id', '=',16)
                     ->orWhere('locations.company_id', '=',23)
                     ->orWhere('locations.company_id', '=',27)
                            ->get();
        } else {
            if ($company) {
                $list = Location::whereCompanyId($company->id)
                                ->orderBy('id', 'DESC')
                                ->get();
            }
        }

        $total = $list->count();

        return view('dashboard.enterprise.locations.index', [
            'locations' => $list->slice(0, $this->perPage)->transformWith(new LocationsTransformer(true))->toArray(),
            'pages'     => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show locations on google map page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */

    // and date_trunc('day', timestamp) = date_trunc('day', current_date)
    public function map()
    {
        $list = DB::select("select id,name,lat,lng,
            CASE
            WHEN count IS NULL THEN 0
            ELSE count
            END

            from
            (
            select id,name, lat,lng from locations
            ) locations

            left join
            (
            select location_id,count(*)
            from checkin_history where date_trunc('year', timestamp) = date_trunc('year', current_date)  and date_trunc('month', timestamp) = date_trunc('month', current_date)

            group by location_id
            ) totals

            on locations.id = totals.location_id
            where lat IS NOT NULL and count > 0");

        Mapper::map(38.6532136, -90.3135017, ['zoom' => 5, 'center' => true, 'marker' => false]);
        foreach ($list as $loc) {
            Mapper::marker($loc->lat, $loc->lng, [
                // 'label' => $loc->name,
                // 'title' 	=> 'title',
                'icon'      => [
                    'path'         => 'M10.5,0C4.7,0,0,4.7,0,10.5c0,10.2,9.8,19,10.2,19.4c0.1,0.1,0.2,0.1,0.3,0.1s0.2,0,0.3-0.1C11.2,29.5,21,20.7,21,10.5 C21,4.7,16.3,0,10.5,0z M10.5,5c3,0,5.5,2.5,5.5,5.5S13.5,16,10.5,16S5,13.5,5,10.5S7.5,5,10.5,5z',
                    'fillColor'    => $loc->count>0?'#51ED4C':'#ED514C',
                    'fillOpacity'  => 1,
                    'strokeWeight' => 0,
                    'anchor'       => [0, 0],
                    'origin'       => [0, 0],
                    'size'         => [21, 30],
                    'labelOrigin'  => [10, -10],
                ],
                'label'     => [
                    'text' => $loc->name,
                    'color' => '#495959',
                    'fontFamily' => 'Arial',
                    'fontSize' => '15px',
                    'fontWeight' => 'bolder',
                ],
                'autoClose' => true,
                'clickable' => true,
                'cursor' => 'default',
                'opacity' => 1.0,
                'visible' => true,
                'zIndex' => 1000,
            ]);
        }

        return view('dashboard.enterprise.locations.map');
    }

    /**
     * Filter locations list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $company = auth()->user()->company;

        $locations = collect([]);
        // HAVE TO FIX!!!
        if (auth()->user()->isRoot()) {
            $locations = Location::orderBy('id', 'DESC')
                                 ->get();
        } else  if (auth()->user()->isInsurance()) {
            $locations = Location::orderBy('id', 'DESC')
             ->where('locations.company_id', '=',16)
             ->orWhere('locations.company_id', '=',23)
                     ->orWhere('locations.company_id', '=',27)
                                 ->get();
        } else {
            if ($company) {
                $locations = Location::whereCompanyId($company->id)
                                     ->orderBy('id', 'DESC')
                                     ->get();
            }
        }

        if (request()->get('search')) {
            $locations = $locations->filter(function ($item) {
                return stristr($item->name.' '.$item->address, request()->get('search')) ||
                       stristr($item->state.' '.$item->city.' '.$item->address, request()->get('search')) ||
                       stristr($item->phone, request()->get('search')) ||
                       stristr($item->id, request()->get('search')) ||
                       stristr($item->club_id, request()->get('search'));
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

    /**
     * Switch user Location
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function switch($locationId)
    {
        $company = auth()->user()->company;

        if ($company) {
            if (auth()->user()->isRoot()) {
                $location = Location::whereId($locationId)
                                    ->first();
            }  else if (auth()->user()->isInsurance()) {
                $location = Location::whereId($locationId)
                                    ->first();
            } else {
                $location = Location::whereCompanyId($company->id)
                                    ->whereId($locationId)
                                    ->first();
            }


            if ($location) {
                auth()->user()->location_id = $location->id;
                auth()->user()->save();

                return redirect(route('enterprise.locations'));
            }
        }

        return abort(404);
    }

    /**
     * Show locations list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function list()
    {
        Cache::put('latestLocationsList', 'enterprise');

        $company = auth()->user()->company;

        $list = collect([]);
        if ($company) {
            $list = Location::whereCompanyId($company->id)
                            ->orderBy('id', 'DESC')
                            ->get();
        }

        $total = $list->count();

        return view('dashboard.company.locations.index', [
            'enterpriseLocation' => true,
            'locations'          => $list->slice(0, $this->perPage)->transformWith(new LocationsTransformer(true))->toArray(),
            'pages'              => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show locations edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($locationId)
    {
        $company = auth()->user()->company;

        if (auth()->user()->isInsurance()) {
            $location = Location::whereId($locationId)
                                ->first();
        } else {
            $location = Location::whereCompanyId($company->id)
                                ->find($locationId);
        }

        if (!$location) {
            return abort(404);
        }

        return view('dashboard.company.locations.manage', [
            'enterpriseLocation' => true,
            'location'           => $location,
        ]);
    }

    /**
     * Save location
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function save()
    {
        $company = auth()->user()->company;

        if (!$company) {
            return abort(404);
        }

        /* Check Club ID unique field */
        $clubIdAlreadyExists = Location::where('club_id', request()->get('club_id'))->where('id', '!=', request()->get('location_id'))->first();

        if ($clubIdAlreadyExists) {
            return redirect()->back()->withInput()->with('errorMessage', 'This Club ID is already have been taken.');
        }

        $locationId = request()->has('location_id') ? request()->get('location_id') : null;

        if (!$locationId) {
            $location = new Location();
        } else {
            if (auth()->user()->isInsurance()) {
                $location = Location::whereId($locationId)
                                    ->first();
            } else {
                $location = Location::whereCompanyId($company->id)
                                    ->find($locationId);
            }

            if (!$location) {
                return abort(404);
            }
        }

        $location->company_id  = $company->id;
        $location->club_id     = request()->get('club_id');
        $location->name        = request()->get('name');
        $location->state       = request()->get('state');
        $location->city        = request()->get('city');
        $location->postal      = request()->get('postal');
        $location->address     = request()->get('address');
        $location->phone       = request()->get('phone');
        $location->lat         = request()->get('lat');
        $location->lng         = request()->get('lng');
        $location->provisioned = request()->get('provisioned') ? 1 : 0;
        $location->franchise   = request()->get('franchise');
        $location->save();

        $from = Cache::get('latestLocationsList');

        return redirect(route($from == 'root' ? 'root.locations' : 'enterprise.locations.list'))->with('successMessage', 'Your updates have been saved');
    }
}
