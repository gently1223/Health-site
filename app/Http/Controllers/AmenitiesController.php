<?php

namespace App\Http\Controllers;

use App\Models\Amenities;
use App\Models\Company\AmenitiesLocation;

class AmenitiesController extends Controller
{
    /**
     * Save location amenities settings.
     *
     * @return Illuminate\Http\JsonResponse
     */
    public function save()
    {
        $location  = auth()->user()->location;
        $amenities = Amenities::all();

        $filled = request()->get('filled');

        if (!is_array($filled)) {
            return response()->json([
                'success' => false,
                'message' => 'Something went wrong. Try again later',
            ]);
        }

        $responses = [];
        foreach ($amenities as $item) {
            $isFilled = false;
            if (isset($filled[$item->id])) {
                $isFilled = true;
                $value    = $filled[$item->id];
            }

            if ($item->type == 'double') {
                if (!is_numeric($value)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Only dollar value is allowed for "'.$item->title.'".',
                    ]);
                }

                $formatted = number_format($value, 2, '.', '');

                if ($value != $formatted || $value > 99999999) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Only dollar value is allowed for "'.$item->title.'".',
                    ]);
                }

                $value = $formatted;
            }

            if ($isFilled) {
                $responses[] = [
                    'location_id' => $location->id,
                    'amenity_id'  => $item->id,
                    'responses'   => $value,
                ];
            } elseif (!$isFilled && $item->required) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please, fill required fields',
                ]);
            }
        }

        foreach ($responses as $response) {
            $toSave = AmenitiesLocation::firstOrNew([
                'location_id' => $response['location_id'],
                'amenity_id'  => $response['amenity_id'],
            ]);

            $toSave->responses = $response['responses'];
            $toSave->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Amenities settings successfuly saved',
        ]);
    }
}
