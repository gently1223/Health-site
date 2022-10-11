<?php

namespace App\Http\Controllers\Root;

use App\Models\Company\CompanyProgramSector;

class CompanyProgramSectorController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show sectors list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $list = CompanyProgramSector::orderBy('id', 'DESC')->get();

        $total = $list->count();

        return view('dashboard.root.sectors.index', [
            'sectors' => $list->slice(0, $this->perPage)->toArray(),
            'pages'     => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter sectors list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $sectors = CompanyProgramSector::orderBy('id', 'DESC')->get();

        if (request()->get('search')) {
            $sectors = $sectors->filter(function ($item) {
                return  stristr($item->name, request()->get('search'));
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $sectors->count();

        return response()->json([
            'success' => true,
            'list'    => $sectors->slice($page * $this->perPage, $this->perPage)->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show create sector page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        return view('dashboard.root.sectors.manage');
    }

    /**
     * Show sectors edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($sectorId)
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        $sector = CompanyProgramSector::whereId($sectorId)->first();

        if (!$sector) {
            return abort(404);
        }

        return view('dashboard.root.sectors.manage', [
            'sector'           => $sector,
        ]);
    }

    /**
     * Save sector
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function save()
    {
        $sectorId = request()->has('id') ? request()->get('id') : null;

        if (!$sectorId) {
            $sector = CompanyProgramSector::create(request()->all());
        } else {
            $sector = CompanyProgramSector::find($sectorId);
            if (!$sector) {
                return abort(404);
            }
            $sector->update(request()->all());
        }

        return redirect(route('root.sectors'))->with('successMessage', 'Your updates have been saved');
    }
}
