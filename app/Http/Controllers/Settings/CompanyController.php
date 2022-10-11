<?php

namespace App\Http\Controllers\Settings;

use Illuminate\Http\Request;
use App\Models\Company\Company;

class CompanyController extends \App\Http\Controllers\Controller
{

    /**
     * Show Authenticated user edit profile page.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $company = auth()->user()->company;

        return view('dashboard.settings.company', [
            'company' => (object) [
                'csv_delimiter' => $company->csv_delimiter,
                'compressed'    => $company->compressed,
                'billable'      => $company->billable,
            ],
        ]);
    }

    /**
     * Save Authenticated user profile changes.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function save()
    {
        $company = Company::find(auth()->user()->company->id);


        request()->validate([
            'csv_delimiter' => 'required|in:comma,tab',
        ]);

        if (auth()->user()->hasRole('root')) {
            $compressed = request()->get('compressed') == 'on' ? 1 : 0;
            $billable   = request()->get('billable') == 'on' ? 1 : 0;
            
            $company->compressed = $compressed;
            $company->billable   = $billable;
        }

        $company->csv_delimiter = request()->get('csv_delimiter') == 'comma' ? 'comma' : 'tab';
        $company->save();

        return redirect(route('settings.company'))->with('successMessage', 'Your updates have been saved');
    }
}
