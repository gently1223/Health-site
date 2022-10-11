<?php

namespace App\Http\Controllers\Root;

use App\Models\Program;

class ProgramController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show programs list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $list = Program::orderBy('id', 'DESC')->get();

        $total = $list->count();

        return view('dashboard.root.programs.index', [
            'programs' => $list->slice(0, $this->perPage)->toArray(),
            'pages'     => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Filter programs list
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $programs = Program::orderBy('id', 'DESC')->get();

        if (request()->get('search')) {
            $programs = $programs->filter(function ($item) {
                return  stristr($item->name, request()->get('search')) ||
                        stristr($item->group, request()->get('search')) ||
                        stristr($item->header, request()->get('search'));
            });
        }

        $page = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;

        $total = $programs->count();

        return response()->json([
            'success' => true,
            'list'    => $programs->slice($page * $this->perPage, $this->perPage)->toArray(),
            'pages'   => ceil($total / $this->perPage),
        ]);
    }

    /**
     * Show create program page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        return view('dashboard.root.programs.manage');
    }

    /**
     * Show programs edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($programId)
    {
        if (!auth()->user()->isRoot()) {
            return abort(403);
        }

        $program = Program::whereId($programId)->first();

        if (!$program) {
            return abort(404);
        }

        return view('dashboard.root.programs.manage', [
            'program'           => $program,
        ]);
    }

    /**
     * Save program
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function save()
    {
        $programId = request()->has('id') ? request()->get('id') : null;

        if (!$programId) {
            $program = new Program();
        } else {
            $program = Program::find($programId);
            if (!$program) {
                return abort(404);
            }
        }

        $program->name = request()->get('name');
        $program->desc = request()->get('desc');
        $program->url = request()->get('url');
        $program->type = request()->get('type');
        $program->status = request()->get('status');
        $program->web = request()->get('web');
        $program->group = request()->get('group');
        $program->header = request()->get('header');
        $program->valid_email = request()->has('valid_email') ? 'true' : 'false';
        $program->locked = request()->has('locked') ? 1 : 0;
        $program->save();

        return redirect(route('root.programs'))->with('successMessage', 'Your updates have been saved');
    }
}
