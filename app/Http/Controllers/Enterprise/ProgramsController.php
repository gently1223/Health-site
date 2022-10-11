<?php

namespace App\Http\Controllers\Enterprise;

use App\Models\Program;
use App\Models\Company\CompanyProgram;
use App\Models\Company\CompanyProgramTier;
use App\Models\Company\CompanyProgramSector;
use Illuminate\Http\Request;

class ProgramsController extends \App\Http\Controllers\Controller
{

    /**
     * Show programs list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $company = auth()->user()->company;
        if (!$company) {
            return abort(404);
        }

        $location = auth()->user()->location;

        if (!$location) {
            return abort(404);
        }

        $companyProgram = CompanyProgram::with(['tier', 'sector'])
                                        // ->where('company_id', $company->id)
                                        ->where(function($query) use ($location){
                                            $query->whereIn('location_id', [$location->id, -1]);
                                        })->get();


        $allPrograms = Program::whereNotIn('id', [0])->where('type', 1)->where('new', 0)->where('status', 1)->pluck('name', 'id');

        $programs    = $companyProgram->map(function($item) {
            return (object) [
                'id'          => $item->id,
                'name'        => trim($item->program->name),
                'tier'        => $item->tier && $item->tier->name ? $item->tier->name : 'None',
                'sector'      => $item->sector && $item->sector->name ? $item->sector->name : 'None',
                'rate'        => $item->rate,
                'program_id'  => $item->program_id,
                'hourly_rate' => $item->hourly_rate,
                'daily_rate'  => $item->daily_rate,
                'allowance'   => $item->allowance,
                'restriction' => $item->restriction,
                'status'      => $item->status,
                'global'      => $item->location_id == -1,
            ];
        });

        return view('dashboard.enterprise.programs.index', [
            'total'    => $allPrograms->count(),
            'programs' => $programs,
        ]);
    }

    /**
     * Show add program list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function add()
    {
        $company = auth()->user()->company;
        if (!$company) {
            return abort(404);
        }

        $allPrograms = Program::whereNotIn('id', [0])
                              ->where('type', 1)
                              ->where('status', 1)
                              ->where('new', 0)
                              ->get();

        $list = [];
        foreach ($allPrograms as $program) {
            $list[] = (object) [
                'id'   => $program->id,
                'name' => $program->name,
            ];
        }

        return view('dashboard.enterprise.programs.add', [
            'programs' => $list,
        ]);
    }

    /**
     * Show edit program page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($id)
    {
        $company = auth()->user()->company;
        if (!$company) {
            return abort(404);
        }

        $location = auth()->user()->location;

        if (!$location) {
            return abort(404);
        }

        $program = CompanyProgram::where('id', $id)
                                 ->where('company_id', $company->id)
                                 ->first();

        if (!$program) {
            return abort(404);
        }

        $tiers   = CompanyProgramTier::where('status', 1)->pluck('name', 'id');
        $sectors = CompanyProgramSector::where('status', 1)->pluck('name', 'id');

        return view('dashboard.enterprise.programs.manage', [
            'program' => $program,
            'tiers'   => $tiers,
            'sectors' => $sectors,
        ]);
    }

    /**
     * Save program
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function save($id)
    {
        $company = auth()->user()->company;
        if (!$company) {
            return abort(404);
        }

        $location = auth()->user()->location;
        if (!$location) {
            return abort(404);
        }

        $program = CompanyProgram::where('id', $id)
                                 ->where('company_id', $company->id)
                                 ->first();

        if (!$program) {
            return abort(404);
        }

        $tiersIds   = CompanyProgramTier::where('status', 1)->pluck('id')->toArray();
        $sectorsIds = CompanyProgramSector::where('status', 1)->pluck('id')->toArray();

        request()->validate([
            'rate'        => 'required|numeric',
            'daily_rate'  => 'required|numeric',
            'hourly_rate' => 'required|numeric',
            'allowance'   => 'required|numeric',
            'restriction' => 'required|numeric',
            'tier_id'     => 'required|in:'.implode(',', $tiersIds),
            'sector_id'   => 'required|in:'.implode(',', $sectorsIds),
            'status'      => 'nullable',
        ]);

        $program->rate        = request()->get('rate');
        $program->daily_rate  = request()->get('daily_rate');
        $program->hourly_rate = request()->get('hourly_rate');
        $program->allowance   = request()->get('allowance');
        $program->restriction = request()->get('restriction');
        $program->status      = request()->get('status') ? 1 : 0;
        $program->sector_id   = request()->get('sector_id');
        $program->tier_id     = request()->get('tier_id');
        $program->save();

        return redirect(route('enterprise.programs'))->with('successMessage', 'Your updates have been saved');
    }

    /**
     * Connect program for company
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function connect()
    {
        $location = auth()->user()->location->id;
        if (!$location) {
            return abort(404);
        }

        $programId = request()->get('program_id');
        if (request()->has('program_gid')) {
            if (!auth()->user()->isRoot()) {
                return abort(403);
            }

            $programId = request()->get('program_gid');
            $location = -1;
        }

        $rate = request()->get('rate-'.$programId);

        $company = auth()->user()->company;
        if (!$company) {
            return abort(404);
        }

        $program = Program::where('id', $programId)->where('type', 1)->first();
        if ($program) {
            $companyProgram = CompanyProgram::create([
                'company_id'  => $company->id,
                'program_id'  => $program->id,
                'location_id' => $location,
            ]);

            $companyProgram->rate = $rate && intval($rate) > 0 ? $rate : 0;
            $companyProgram->save();

            return redirect(route('enterprise.programs'))->with('successMessage', 'Program successfully added');
        }

        return redirect(route('enterprise.programs'));
    }

    /**
     * Disable program for company
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function disable($id)
    {
        $company = auth()->user()->company;
        if (!$company) {
            return abort(404);
        }

        $program = CompanyProgram::where('company_id', $company->id)
                                 ->where('id', $id)
                                 ->delete();

        return redirect(route('enterprise.programs'))->with('successMessage', 'Program successfully removed');
    }
}
