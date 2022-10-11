<?php

namespace App\Http\Controllers\Club;

use App\Models\Users\User;
use App\Models\Users\Roles;

use App\Helpers\ImageHelper;
use App\Transformers\Company\EmployeesTransformer;

class EmployeesController extends \App\Http\Controllers\Controller
{
    protected $perPage = 15;

    /**
     * Show employees list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $employees = auth()->user()->company ? auth()->user()->company->employees->whereIn('role.slug', ['club_admin', 'club_employee'])->where('location_id', auth()->user()->location_id) : collect([]);

        $total = $employees->count();

        return view('dashboard.company.employees.index', [
            'enterpriseEmployees' => false,
            'employees'           => $employees->slice(0, $this->perPage)->transformWith(new EmployeesTransformer())->toArray(),
            'pages'               => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter employees list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        if (auth()->user()->company) {
            $employees = auth()->user()->company->employees->whereIn('role.slug', ['club_admin', 'club_employee'])->where('location_id', auth()->user()->location_id);
            if (request()->get('search')) {
                $employees = $employees->filter(function ($item) {
                    return stristr($item->displayName, request()->get('search')) || stristr($item->phone, request()->get('search')) || stristr($item->email, request()->get('search'));
                });
            }
        } else {
            $employees = collect([]);
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $employees->count();

        return response()->json([
            'success' => true,
            'list'    => $employees->slice($page * $this->perPage, $this->perPage)->transformWith(new EmployeesTransformer())->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show employee create page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        if (!auth()->user()->isAdmin()) {
            return abort(403);
        }

        $roles = Roles::whereIn('slug', ['club_admin', 'club_employee'])->pluck('name', 'slug')->toArray();

        return view('dashboard.company.employees.manage', [
            'enterpriseEmployees' => false,
            'allowedRoles'        => $roles,
        ]);
    }

    /**
     * Show employee edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($employeeId)
    {
        if (!auth()->user()->isAdmin()) {
            return abort(403);
        }

        $employee = auth()->user()->company->employees->where('location_id', auth()->user()->location_id)->where('id', $employeeId)->first();
        $roles = Roles::whereIn('slug', ['club_admin', 'club_employee'])->pluck('name', 'slug')->toArray();

        if (!$employee) {
            return abort(404);
        }

        if (!isset($roles[$employee->role->slug])) {
            return abort(403);
        }

        return view('dashboard.company.employees.manage', [
            'enterpriseEmployees' => false,
            'employee'            => $employee,
            'allowedRoles'        => $roles,
        ]);
    }

    /**
     * Save employee
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function save()
    {
        if (!auth()->user()->isAdmin()) {
            return abort(403);
        }

        request()->validate([
            'email'      => 'required|email',
            'first_name' => 'required|string',
            'last_name'  => 'required|string',
            'phone'      => 'nullable|string',
            'avatar'     => 'nullable|string',
        ]);

        $avatar = null;
        if (request()->get('avatar') && ImageHelper::exists(request()->get('avatar')) && stripos(request()->get('avatar'), '/temp') >= 0) {
            $avatar   = true;

            if (!ImageHelper::isTempStorageImage(request()->get('avatar'))) {
                return redirect()->back()->withErrors(['avatar' => ['Only image files supported.']])->withInput();
            }
        }

        if (request()->get('employeeId')) {
            $employee = auth()->user()->company->employees->where('location_id', auth()->user()->location_id)
                                                          ->where('id', request()->get('employeeId'))
                                                          ->first();

            if (!$employee) {
                return abort(404);
            }
        } else {
            $employee = new User;
        }

        /* Check if email is free to use */
        $emailIsUsed = User::whereEmail(request()->get('email'))
                           ->where('id', '<>', request()->get('employeeId'))
                           ->first();

        if ($emailIsUsed) {
            return redirect()->back()->withErrors(['email' => ['This email has already been taken.']])->withInput();
        }

        $roles = Roles::whereIn('slug', ['club_admin', 'club_employee'])->pluck('name', 'slug')->toArray();
        if (!isset($roles[request()->get('role')])) {
            return redirect()->back()->withErrors(['role' => ['You are not allowed to associate user to this role.']])->withInput();
        }

        $role = Roles::where('slug', request()->get('role'))->first();
        $employee->role_id = $role->id;

        if (!request()->get('employeeId') || request()->get('password')) {
            request()->validate([
                'password' => 'required|confirmed',
            ]);

            $employee->password = request()->get('password');
        }

        if (!request()->get('employeeId')) {
            $employee->status      = 1;
            $employee->location_id = auth()->user()->location_id;
            $employee->photo       = 'https://d2x5ku95bkycr3.cloudfront.net/App_Themes/Common/images/profile/0_200.png';
        } else {
            $employee->status = request()->get('status') ? 1 : 0;
        }

        $employee->email    = request()->get('email');
        $employee->fname    = request()->get('first_name');
        $employee->lname    = request()->get('last_name');
        $employee->phone    = request()->get('phone');

        if ($avatar) {
            $path = str_replace('/temp', '', request()->get('avatar'));

            ImageHelper::moveStorageToPublic(request()->get('avatar'), $path);

            $employee->photo = url($path);
        }

        $employee->save();

        return redirect(route('club.employees'))->with('successMessage', 'Your updates have been saved');
    }
}
