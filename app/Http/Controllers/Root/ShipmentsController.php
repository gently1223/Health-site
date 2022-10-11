<?php

namespace App\Http\Controllers\Root;

use App\Models\Company\Shipment;

use Illuminate\Support\Facades\Cache;

class ShipmentsController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show locations list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $list = Shipment::with(['company', 'location'])
                        ->orderBy('id', 'DESC')
                        ->limit($this->perPage)
                        ->get();

        $total = Shipment::count();

        return view('dashboard.root.shipments.index', [
            'shipments' => $list->toArray(),
            'pages'     => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter shipments list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $shipments = Shipment::with(['company', 'location'])
                             ->orderBy('id', 'DESC')
                             ->get();

        if (request()->get('search')) {
            $shipments = $shipments->filter(function ($item) {
                return stristr($item->company->name.' '.$item->location->name, request()->get('search')) ||
                       stristr($item->location->name.' '.$item->address, request()->get('search')) ||
                       stristr($item->state.' '.$item->city.' '.$item->address, request()->get('search')) ||
                       stristr($item->phone, request()->get('search')) ||
                       stristr($item->id, request()->get('search'));
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $shipments->count();

        return response()->json([
            'success' => true,
            'list'    => $shipments->slice($page * $this->perPage, $this->perPage)->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }
}
