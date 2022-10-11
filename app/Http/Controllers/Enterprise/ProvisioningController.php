<?php

namespace App\Http\Controllers\Enterprise;

use App\Models\Company\Location;

use App\Transformers\Company\ProvisioningTransformer;

class ProvisioningController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show provisioning locations list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $company = auth()->user()->company;

        $list = collect([]);
        if ($company) {
            $list = Location::whereCompanyId($company->id)
                            ->orderBy('provisioned', 'ASC')
                            ->get();
        }

        $total = $list->count();

        return view('dashboard.enterprise.provisioning.index', [
            'enterpriseLocation' => true,
            'locations'          => $list->slice(0, $this->perPage)->transformWith(new ProvisioningTransformer())->toArray(),
            'pages'              => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter provisioning locations list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $company = auth()->user()->company;

        $locations = collect([]);
        if ($company) {
            $locations = Location::whereCompanyId($company->id)
                                 ->orderBy('provisioned', 'ASC')
                                 ->get();
        }

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
            'list'    => $locations->slice($page * $this->perPage, $this->perPage)->transformWith(new ProvisioningTransformer())->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }
}
