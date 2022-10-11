<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Waitlist;
use Illuminate\Support\Facades\Validator;

class WaitlistController extends Controller
{

    /**
     * Show the waitlist form.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        return view('waitlist.form');
    }

    /**
     * Save data.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function save()
    {
        $validator = Validator::make(request()->all(), [
            'legal_business_entity'      => 'required|string',
            'name_of_crossfit_affiliate' => 'required|string',
            'address_of_location'        => 'required|string',
            'retail_membership_rate'     => 'required|string',
            'contractor_first_name'      => 'required|string',
            'contractor_last_name'       => 'required|string',
            'contractor_email'           => 'required|string|email',
            'direct_point_first_name'    => 'string|nullable',
            'direct_point_last_name'     => 'string|nullable',
            'direct_point_email'         => 'string|nullable|email',
        ]);

        if ($validator->fails()) {
            return redirect(route('waitlist.index'))
                        ->withErrors($validator)
                        ->withInput();
        }

        Waitlist::create([
            'legal_business_entity'      => trim(request()->get('legal_business_entity')),
            'name_of_crossfit_affiliate' => trim(request()->get('name_of_crossfit_affiliate')),
            'address_of_location'        => trim(request()->get('address_of_location')),
            'retail_membership_rate'     => trim(request()->get('retail_membership_rate')),
            'contractor_first_name'      => trim(request()->get('contractor_first_name')),
            'contractor_last_name'       => trim(request()->get('contractor_last_name')),
            'contractor_email'           => trim(request()->get('contractor_email')),
            'direct_point_first_name'    => trim(request()->get('direct_point_first_name')) ?: '',
            'direct_point_last_name'     => trim(request()->get('direct_point_last_name')) ?: '',
            'direct_point_email'         => trim(request()->get('direct_point_email')) ?: '',
        ]);

        return redirect(route('waitlist.success'));
    }

    /**
     * Show success message.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function success()
    {
        return view('waitlist.success');
    }
}
