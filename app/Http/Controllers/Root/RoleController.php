<?php

namespace App\Http\Controllers\Root;

use App\Models\Users\Roles;

class RoleController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show roles list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $list = Roles::orderBy('id', 'DESC')->get();

        $total = $list->count();

        return view('dashboard.root.roles.index', [
            'roles' => $list->slice(0, $this->perPage)->toArray(),
            'pages'     => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter roles list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $roles = Roles::orderBy('id', 'DESC')->get();

        if (request()->get('search')) {
            $roles = $roles->filter(function ($item) {
                return  stristr($item->name, request()->get('search')) ||
                        stristr($item->slug, request()->get('search'));
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $roles->count();

        return response()->json([
            'success' => true,
            'list'    => $roles->slice($page * $this->perPage, $this->perPage)->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show create role page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        return view('dashboard.root.roles.manage');
    }

    /**
     * Show roles edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($roleId)
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        $role = Roles::whereId($roleId)->first();

        if (!$role) {
            return abort(404);
        }

        return view('dashboard.root.roles.manage', [
            'role'           => $role,
        ]);
    }

    /**
     * Save role
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function save()
    {
        $roleId = request()->has('id') ? request()->get('id') : null;

        if (!$roleId) {
            $client = Roles::create(request()->all());
        } else {
            $client = Roles::find($roleId);
            if (!$client) {
                return abort(404);
            }
            $client->update(request()->all());
        }

        return redirect(route('root.roles'))->with('successMessage', 'Your updates have been saved');
    }
}
