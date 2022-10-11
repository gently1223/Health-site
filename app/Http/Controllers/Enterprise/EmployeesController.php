<?php

namespace App\Http\Controllers\Enterprise;

use App\Models\Users\User;
use App\Models\Users\Roles;
use App\Models\Company\Location;

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
        $roles = Roles::getHierarchyForRole(auth()->user()->role->slug);

        $employees = User::all();

        $total = $employees->count();

        return view('dashboard.company.employees.index', [
            'enterpriseEmployees' => true,
            'employees'           => $employees->slice(0, $this->perPage)->transformWith(new EmployeesTransformer(true), $roles)->toArray(),
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
        $roles = Roles::getHierarchyForRole(auth()->user()->role->slug);

        if (auth()->user()->company) {
            if (request()->get('search')) {
                $employees = User::all()->filter(function ($item) {
                    return stristr($item->displayName, request()->get('search')) || stristr($item->phone, request()->get('search')) || stristr($item->email, request()->get('search'));
                });
            } else {
                $employees = User::all();
            }
        } else {
            $employees = collect([]);
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $employees->count();

        return response()->json([
            'success' => true,
            'list'    => $employees->slice($page * $this->perPage, $this->perPage)->transformWith(new EmployeesTransformer(true), $roles)->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show employee add page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        if (!auth()->user()->isAdmin()) {
            return abort(403);
        }

        $locations = Location::select('id', 'name', 'address')
                                ->orderBy('id', 'DESC')
                                ->get();

        $roles = Roles::getHierarchyForRole(auth()->user()->role->slug);

        if (isset($roles['club_member'])) {
            unset($roles['club_member']);
        }

        return view('dashboard.company.employees.manage', [
            'enterpriseEmployees' => true,
            'allowedRoles'        => $roles,
            'employee'            => null,
            'locations'           => $locations,
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

        $roles = Roles::getHierarchyForRole(auth()->user()->role->slug);

        $employee  = User::find($employeeId);
        $locations = Location::select('id', 'name', 'address')
                                ->orderBy('id', 'DESC')
                                ->get();

        if ($employee && !isset($roles[$employee->role->slug])) {
            return abort(403);
        }

        if (isset($roles['club_member'])) {
            unset($roles['club_member']);
        }

        return view('dashboard.company.employees.manage', [
            'enterpriseEmployees' => true,
            'allowedRoles'        => $roles,
            'employee'            => $employee,
            'locations'           => $locations,
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

        $locations = Location::select('id', 'name', 'address')
                                ->orderBy('id', 'DESC')
                                ->get();

        request()->validate([
            'email'       => 'required|email',
            'first_name'  => 'required|string',
            'last_name'   => 'required|string',
            'phone'       => 'nullable|string',
            'location_id' => 'required|in:'.implode(',', $locations->pluck('id')->toArray()),
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
            $employee = User::find(request()->get('employeeId'));

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

        $roles = Roles::getHierarchyForRole(auth()->user()->role->slug);

        if (isset($roles['club_member'])) {
            unset($roles['club_member']);
        }

        if (!isset($roles[request()->get('role')])) {
            return redirect()->back()->withErrors(['role' => ['You are not allowed to associate user to this role.']])->withInput();
        }

        $role = Roles::where('slug', request()->get('role'))->first();
        $employee->role_id = $role->id;

        if (request()->get('password')) {
            request()->validate([
                'password' => 'required|confirmed',
            ]);

            $employee->password = request()->get('password');
        }

        $employee->status      = request()->get('status') ? 1 : 0;
        $employee->email       = request()->get('email');
        $employee->fname       = request()->get('first_name');
        $employee->lname       = request()->get('last_name');
        $employee->phone       = request()->get('phone');
        $employee->location_id = request()->get('location_id');

        if ($avatar) {
            $path = str_replace('/temp', '', request()->get('avatar'));

            ImageHelper::moveStorageToPublic(request()->get('avatar'), $path);

            $employee->photo = url($path);
        }

        $employee->save();

        return redirect(route('enterprise.employees'))->with('successMessage', 'Your updates have been saved');
    }
}
