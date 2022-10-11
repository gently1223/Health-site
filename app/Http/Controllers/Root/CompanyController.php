<?php

namespace App\Http\Controllers\Root;

use App\Models\Company\Company;
use App\Models\Company\CompanyType;

class CompanyController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show companies list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $list = Company::orderBy('id', 'DESC')->get();

        $total = $list->count();

        return view('dashboard.root.company.index', [
            'companies' => $list->slice(0, $this->perPage)->toArray(),
            'pages'     => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter companies list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $companies = Company::orderBy('id', 'DESC')->get();

        if (request()->get('search')) {
            $types = CompanyType::all();
            $companieTypes = $types->filter(function ($item) {
                return stristr($item->name, request()->get('search'));
            })->pluck('id')->toArray();
            $companies = $companies->filter(function ($item) use ($companieTypes) {
                return stristr($item->name, request()->get('search')) || in_array($item->company_type, $companieTypes);
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $companies->count();

        return response()->json([
            'success' => true,
            'list'    => $companies->slice($page * $this->perPage, $this->perPage)->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show create company page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        $types   = CompanyType::all();

        return view('dashboard.root.company.manage', [
            'types'             => $types,
        ]);
    }

    /**
     * Show companies edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($companyId)
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        $company = Company::whereId($companyId)->first();
        $types   = CompanyType::all()->sortBy("id");

        if (!$company) {
            return abort(404);
        }

        return view('dashboard.root.company.manage', [
            'company'           => $company,
            'types'             => $types,
        ]);
    }

    /**
     * Save company
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function save()
    {
        $companyId = request()->has('id') ? request()->get('id') : null;

        if (!$companyId) {
            $company = new Company();
        } else {
            $company = Company::find($companyId);
            if (!$company) {
                return abort(404);
            }
        }

        $company->name = request()->get('name');
        $company->company_type = request()->get('company_type');
        $company->compressed = request()->has('compressed') ? 1 : 0;
        $company->billable = request()->has('billable') ? 1 : 0;
        $company->amenities_required = request()->has('amenities_required') ? 1 : 0;
        $company->csv_delimiter = request()->has('csv_delimiter') ? 'comma' : NULL;
        $company->multi_day_checkin = request()->has('multi_day_checkin') ? 1 : 0;
        $company->save();

        return redirect(route('root.company'))->with('successMessage', 'Your updates have been saved');
    }
}
