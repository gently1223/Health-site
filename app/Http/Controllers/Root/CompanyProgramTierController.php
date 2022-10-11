<?php

namespace App\Http\Controllers\Root;

use App\Models\Company\CompanyProgramTier;

class CompanyProgramTierController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show tiers list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $list = CompanyProgramTier::orderBy('id', 'DESC')->get();

        $total = $list->count();

        return view('dashboard.root.tiers.index', [
            'tiers' => $list->slice(0, $this->perPage)->toArray(),
            'pages'     => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter tiers list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $tiers = CompanyProgramTier::orderBy('id', 'DESC')->get();

        if (request()->get('search')) {
            $tiers = $tiers->filter(function ($item) {
                return  stristr($item->name, request()->get('search'));
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $tiers->count();

        return response()->json([
            'success' => true,
            'list'    => $tiers->slice($page * $this->perPage, $this->perPage)->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show create tier page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        return view('dashboard.root.tiers.manage');
    }

    /**
     * Show tiers edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($tierId)
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        $tier = CompanyProgramTier::whereId($tierId)->first();

        if (!$tier) {
            return abort(404);
        }

        return view('dashboard.root.tiers.manage', [
            'tier'           => $tier,
        ]);
    }

    /**
     * Save tier
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function save()
    {
        $tierId = request()->has('id') ? request()->get('id') : null;

        if (!$tierId) {
            $tier = CompanyProgramTier::create(request()->all());
        } else {
            $tier = CompanyProgramTier::find($tierId);
            if (!$tier) {
                return abort(404);
            }
            $tier->update(request()->all());
        }

        return redirect(route('root.tiers'))->with('successMessage', 'Your updates have been saved');
    }
}
