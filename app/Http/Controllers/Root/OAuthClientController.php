<?php

namespace App\Http\Controllers\Root;

use App\Models\Company\Company;
use App\Models\Oauth\OauthClient;
use App\Models\Program;

class OAuthClientController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show clients list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $list = OauthClient::orderBy('id', 'DESC')->get();

        $total = $list->count();

        return view('dashboard.root.oclients.index', [
            'clients' => $list->slice(0, $this->perPage)->toArray(),
            'pages'     => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter clients list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $clients = OauthClient::orderBy('id', 'DESC')->get();

        if (request()->get('search')) {
            $clients = $clients->filter(function ($item) {
                return  stristr($item->name, request()->get('search')) ||
                        stristr($item->client_id, request()->get('search')) ||
                        stristr($item->secret, request()->get('search')) ||
                        stristr($item->endpoint, request()->get('search'));
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $clients->count();

        return response()->json([
            'success' => true,
            'list'    => $clients->slice($page * $this->perPage, $this->perPage)->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show create client page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        $companies = Company::with('programs')->get();

        return view('dashboard.root.oclients.manage', [
            'companies'        => $companies,
            'programs'         => []
        ]);
    }

    /**
     * Show clients edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($clientId)
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        $client = OauthClient::whereId($clientId)->first();

        if (!$client) {
            return abort(404);
        }

        $companies = Company::with('programs')->get();
        $clientCompany = $companies->filter(function ($c) use ($client) {
            return $c->id == $client->company_id;
        })->values()->all();

        return view('dashboard.root.oclients.manage', [
            'client'           => $client,
            'companies'        => $companies,
            'programs'         => count($clientCompany) > 0?$clientCompany[0]['programs']:[]
        ]);
    }

    /**
     * Save client
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function save()
    {
        $clientId = request()->has('id') ? request()->get('id') : null;

        if (!$clientId) {
            $client = OauthClient::create(request()->all());
        } else {
            $client = OauthClient::find($clientId);
            if (!$client) {
                return abort(404);
            }
            $client->update(request()->all());
        }

        return redirect(route('root.oclients'))->with('successMessage', 'Your updates have been saved');
    }
}
