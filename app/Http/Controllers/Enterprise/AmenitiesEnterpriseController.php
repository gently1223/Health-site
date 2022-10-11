<?php

namespace App\Http\Controllers\Enterprise;

use App\Models\Amenities;
use App\Models\Company\Company;
use App\Models\Company\Location;
use App\Models\Company\AmenitiesLocation;

class AmenitiesEnterpriseController extends \App\Http\Controllers\Controller
{

    protected $perPage = 15;

    /**
     * Show locations with filled amenities list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $locations    = [];
        $locationsIds = AmenitiesLocation::select('location_id')
                                         ->distinct('location_id')
                                         ->skip(0)
                                         ->limit($this->perPage)
                                         ->get()
                                         ->pluck('location_id');

        $pages = ceil(AmenitiesLocation::select('location_id')->distinct('location_id')->count() / $this->perPage);

        if (count($locationsIds)) {
            $locations = Location::whereIn('id', $locationsIds)
                                 ->with('company')
                                //  ->where('status', 1)
                                 ->get()
                                 ->map(function($item) {
                                     return (object) [
                                         'id'           => $item->id,
                                         'name'         => $item->name,
                                         'address'      => $item->address,
                                         'companyId'    => $item->company->id ?? 0,
                                         'companyName'  => $item->company->name ?? '',
                                         'viewLink'     => route('enterprise.amenities.view', $item->id),
                                         'downloadLink' => route('enterprise.amenities.download', $item->id),
                                     ];
                                 });
        }

        return view('dashboard.enterprise.amenities.index', [
            'pages'              => $pages,
            'amenitiesLocations' => $locations,
        ]);
    }

    /**
     * Show location with filled amenities list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function view($locationId)
    {
        $location = Location::where('id', $locationId)->with('company')->first();

        if (!$location) {
            return abort(404);
        }

        $amenities = Amenities::where('type', '!=', 'description')->get();
        $responses = AmenitiesLocation::where('location_id', $locationId)->get()->keyBy('amenity_id');

        return view('dashboard.enterprise.amenities.view', [
            'rootAmenitiesLocation'  => $location,
            'rootAmenities'          => $amenities,
            'rootAmenitiesResponses' => $responses,
        ]);
    }

    /**
     * Download .csv file
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function download($locationId)
    {
        $location = Location::where('id', $locationId)->with('company')->first();

        if (!$location) {
            return abort(404);
        }

        $amenities = Amenities::where('type', '!=', 'description')->get();
        $responses = AmenitiesLocation::where('location_id', $locationId)->get()->keyBy('amenity_id');

        $return = [];
        foreach ($amenities as $amenity) {

            $data = [
                'question' => $amenity->title,
                'response' => isset($responses[$amenity->id]) ? $responses[$amenity->id] : 'NOT SET',
            ];

            if ($amenity->type == 'boolean') {
                if (!isset($responses[$amenity->id])) {
                    $data['response'] = 'NOT SELECTED';
                } else {
                    $data['response'] = $responses[$amenity->id] ? 'YES' : 'NO';
                }
            } elseif ($amenity->type == 'checkbox') {
                $checkboxResponses = [];

                foreach ($amenity->responses as $key => $response) {
                    $checkboxResponses[$response] = false;

                    if (isset($responses[$amenity->id][$key]) && $responses[$amenity->id][$key]) {
                        $checkboxResponses[$response] = true;
                    }
                }

                $data['response'] = $checkboxResponses;

            }

            $return[] = (object) $data;
        }

        $header    = ['Question'];
        $responses = ['Response'];

        foreach ($return as $field) {
            if (is_array($field->response)) {
                $header[]    = $field->question;
                $responses[] = '';

                foreach ($field->response as $question => $bool) {
                    $header[]    = $question;
                    $responses[] = $bool ? 'YES' : 'NO';
                }
            } else {
                $header[]    = $field->question;
                $responses[] = $field->response;
            }
        }

        $csv = fopen('php://memory', 'w');

        fputcsv($csv, $header);
        fputcsv($csv, $responses);

        header('Content-Type: application/csv');
        header('Content-Disposition: attachment; filename="Amenities-'.trim(($location->company->name ?? ''). '-'. $location->name .'-'. $location->address).'.csv";');

        fseek($csv, 0);
        fpassthru($csv);
        fclose($csv);

        die();
    }

    /**
     * Download .csv file
     *
     */
    public function downloadAll()
    {
        return response()->streamDownload(function () {
            $return    = [];
            $amenities = Amenities::where('type', '!=', 'description')->get();

            $created = '';
            $updated = '';

            AmenitiesLocation::select('location_id')->distinct('location_id')->orderBy('location_id')->chunk(50, function ($items) use ($amenities, &$return) {
                $processed    = [];
                $locationsIds = $items->pluck('location_id')->toArray();

                $responses = AmenitiesLocation::whereIn('location_id', $locationsIds)->get();

                foreach ($responses as $response) {
                    if (!isset($processed[$response->location_id])) {
                        $processed[$response->location_id] = [];
                    }

                    $processed[$response->location_id][$response->amenity_id] = $response->responses;
                }

                $locations = Location::whereIn('id', $locationsIds)->with('company')->get();
               
                foreach ($locations as $location) {

                    $created = AmenitiesLocation::where('location_id', $location->id)->whereNotNull('created')->limit(1)->get();
                    $updated = AmenitiesLocation::where('location_id', $location->id)->whereNotNull('updated')->limit(1)->get();
                    
                    if (count($created) > 0)
                        foreach ($created as $create) {
                            if ($create->created) {
                               $created = date('Y-m-d', strtotime($create->created));
                               break;
                            }
                        
                        }
                     else
                        $created = '';

                     if (count($updated) > 0)
                        foreach ($updated as $update) {
                            if ($update->updated) {
                                $updated = date('Y-m-d', strtotime($update->updated));
                                break;
                            }
                        }
                     else 
                         $updated = '';


                    foreach ($amenities as $amenity) {
                        $address = [];

                        if ($location->address) {
                            $address[] = $location->address;
                        }

                        if ($location->city) {
                            $address[] = $location->city;
                        }

                        if ($location->state) {
                            $address[] = $location->state;
                        }

                        if ($location->postal) {
                            $address[] = $location->postal;
                        }

                        if (!isset($return[$location->id])) {
                            $return[$location->id] = [
                                'club_id'   => $location->club_id ?? '',
                                'company'   => $location->company->name ?? '',
                                'location'  => $location->name,
                                'address'   => implode(', ', $address),
                                'phone'     => $location->phone,
                                'created'   => $created,
                                'updated'   => $updated,
                                'responses' => [],
                            ];
                        }

                        $data = [
                            'question' => $amenity->title,
                            'response' => isset($processed[$location->id][$amenity->id]) ? $processed[$location->id][$amenity->id] : 'NOT SET',
                        ];

                        if ($amenity->type == 'boolean') {
                            if (!isset($processed[$location->id][$amenity->id])) {
                                $data['response'] = 'NOT SELECTED';
                            } else {
                                $data['response'] = $processed[$location->id][$amenity->id] ? 'YES' : 'NO';
                            }
                        } elseif ($amenity->type == 'checkbox') {
                            $checkboxResponses = [];

                            foreach ($amenity->responses as $key => $response) {
                                $checkboxResponses[$response] = false;

                                if (isset($processed[$location->id][$amenity->id][$key]) && $processed[$location->id][$amenity->id][$key]) {
                                    $checkboxResponses[$response] = true;
                                }
                            }

                            $data['response'] = $checkboxResponses;
                        }

                        $return[$location->id]['responses'][] = (object) $data;
                    }
                }
            });

            $csv = fopen('php://output', 'w');

            $header    = ['Club ID','Brand', 'Location', 'Address','Phone','Created','Updated'];
            $rows = [];

            $headerFilled = false;
            foreach ($return as $item) {
                $row = [
                    $item['club_id'],
                    $item['company'],
                    $item['location'],
                    $item['address'],
                    $item['phone'],
                    $item['created'],
                    $item['updated'],
                ];

                foreach ($item['responses'] as $response) {
                    if (!$headerFilled) {
                        if (is_array($response->response)) {
                            $header[] = $response->question;
                            foreach ($response->response as $question => $bool) {
                                $header[] = $question;
                            }
                        } else {
                            $header[] = $response->question;
                        }
                    }

                    if (is_array($response->response)) {
                        $row[] = '';
                        foreach ($response->response as $question => $bool) {
                            $row[] = $bool ? 'YES' : 'NO';
                        }
                    } else {
                        $row[] = $response->response;
                    }
                }

              
                if (!$headerFilled) {
                    fputcsv($csv, $header);
                    $headerFilled = true;
                }

                $rows[] = $row;
                fputcsv($csv, $row);
            }

            fclose($csv);
        }, 'Amenities-'.date('Y-m-d').'.csv');
    }

    /**
     * Search for locations with filled amenities
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function search()
    {
        $searchedLocationsIds = [];
        if (request()->get('search')) {
            $companiesIds = Company::where('name', 'LIKE', '%'. request()->get('search') .'%')->pluck('id')->toArray();
            $searchedLocationsIds = Location::where('name', 'LIKE', '%'. request()->get('search') .'%')
                                            ->orWhere('address', 'LIKE', '%'. request()->get('search') .'%');

            if (count($companiesIds)) {
                $searchedLocationsIds = $searchedLocationsIds->orWhereIn('company_id', $companiesIds);
            }

            $searchedLocationsIds = $searchedLocationsIds->pluck('id')->toArray();
        }

        $locations    = [];
        $locationsIds = AmenitiesLocation::select('location_id')->distinct('location_id');

        if (count($searchedLocationsIds)) {
            $locationsIds = $locationsIds->whereIn('location_id', $searchedLocationsIds);
        }

        $page  = intval(request()->get('page')) > 0 ? intval(request()->get('page')) - 1 : 0;
        $pages = ceil($locationsIds->count() / $this->perPage);
        $locationsIds = $locationsIds->skip($page * $this->perPage)
                                     ->limit($this->perPage)
                                     ->get()
                                     ->pluck('location_id');


        if (count($locationsIds)) {
            $locations = Location::whereIn('id', $locationsIds)
                                 ->with('company')
                                 ->get()
                                 ->map(function($item) {
                                     return (object) [
                                         'id'           => $item->id,
                                         'name'         => $item->name,
                                         'address'      => $item->address,
                                         'companyId'    => $item->company->id ?? 0,
                                         'companyName'  => $item->company->name ?? '',
                                         'viewLink'     => route('enterprise.amenities.view', $item->id),
                                         'downloadLink' => route('enterprise.amenities.download', $item->id),
                                     ];
                                 });
        }

        return response()->json([
            'success' => true,
            'pages'   => $pages,
            'list'    => $locations,
        ]);
    }
}
