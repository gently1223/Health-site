<?php

namespace App\Http\Controllers\Root;

use App\Models\Api;
use App\Models\Company\Company;

class ApiController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show apis list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $list = Api::orderBy('id', 'DESC')->get();

        $total = $list->count();

        return view('dashboard.root.apis.index', [
            'apis' => $list->slice(0, $this->perPage)->toArray(),
            'pages'     => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter apis list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $apis = Api::orderBy('id', 'DESC')->get();

        if (request()->get('search')) {
            $apis = $apis->filter(function ($item) {
                return  stristr($item->name, request()->get('search')) ||
                        stristr($item->apikey, request()->get('search'));
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $apis->count();

        return response()->json([
            'success' => true,
            'list'    => $apis->slice($page * $this->perPage, $this->perPage)->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show create api page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        $companies = Company::all();

        return view('dashboard.root.apis.manage', [
            'companies'        => $companies,
        ]);
    }

    /**
     * Show apis edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($apiId)
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        $api = Api::whereId($apiId)->first();
        $companies = Company::all();

        if (!$api) {
            return abort(404);
        }

        return view('dashboard.root.apis.manage', [
            'api'           => $api,
            'companies'     => $companies,
        ]);
    }

    /**
     * Save api
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function save()
    {
        $apiId = request()->has('id') ? request()->get('id') : null;

        if (!$apiId) {
            $client = Api::create(request()->all());
        } else {
            $client = Api::find($apiId);
            if (!$client) {
                return abort(404);
            }
            $client->update(request()->all());
        }

        return redirect(route('root.apis'))->with('successMessage', 'Your updates have been saved');
    }
}
