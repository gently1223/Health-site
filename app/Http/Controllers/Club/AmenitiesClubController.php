<?php

namespace App\Http\Controllers\Club;

use App\Models\Amenities;

class AmenitiesClubController extends \App\Http\Controllers\Controller
{
    /**
     * Show amenities list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $list = Amenities::orderBy('id', 'ASC')->get()->map(function($item) {
            $item->responses = $item->responses;

            return $item;
        });

        return view('dashboard.club.amenities.index', [
            'list' => $list,
        ]);
    }

    /**
     * Show amenity edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($id)
    {
        $amenity = Amenities::find($id);

        if (!$amenity) {
            return abort(404);
        }

        $amenity->responseFormatted = implode(', ', $amenity->responses);

        return view('dashboard.club.amenities.manage', [
            'amenity' => $amenity,
        ]);
    }

    /**
     * Save amenity changes
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function save($id)
    {
        request()->validate([
            'title'       => 'required|string',
            'type'        => 'required|in:input,boolean,select,checkbox,description,double',
            'description' => 'string|nullable',
            'responses'   => 'string|nullable',
        ]);

        $amenity = Amenities::find($id);

        if (!$amenity) {
            return abort(404);
        }

        $responses = [];
        if (in_array(request()->get('type'), ['select', 'checkbox'])) {
            foreach (explode(',', request()->get('responses')) as $response) {
                $responses[] = trim($response);
            }
        }

        $amenity->title       = request()->get('title');
        $amenity->type        = request()->get('type');
        $amenity->description = request()->get('description') ?? '';
        $amenity->responses   = $responses;
        $amenity->required    = request()->get('required') ? true : false;
        $amenity->save();

        return redirect(route('club.amenities'))->with('successMessage', 'Changes saved');
    }
}
