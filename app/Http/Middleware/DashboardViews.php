<?php

namespace App\Http\Middleware;

use Closure, View;
use Carbon\Carbon;
use App\Models\Amenities;
use App\Models\Company\AmenitiesLocation;
use App\Models\GlobalNotification;

class DashboardViews
{
    /**
     * Form Dashboard view data
     *
     * @var array
     */
    public function handle($request, Closure $next)
    {
        $locationPaymentRequired = false;


        if (auth()->check()) {
            $errors = [];
            $routeName  = $request->route()->getName();
            $routeGroup = explode('.', $routeName);
            $routeCollapse = '';
            if ($routeGroup[0] == 'root' && in_array($routeGroup[1], ['amenities', 'company', 'oclients', 'activity', 'apis', 'challenges', 'programs', 'roles', 'sectors', 'tiers']))
                $routeCollapse = 'root.crud';
            else if ($routeGroup[0] == 'root' && in_array($routeGroup[1], ['report']))
                $routeCollapse = 'root.report';
            else if ($routeGroup[0] == 'enterprise' && in_array($routeGroup[1], ['amenities', 'report']))
                $routeCollapse = 'enterprise.report';

            View::share('activeMenu', $routeName);
            View::share('activeMenuGroup', collect($routeGroup)->first());
            View::share('activeMenuCollapse', $routeCollapse);

            View::share('companySettigns', [
                'color' => auth()->user()->company ? auth()->user()->company->color : null,
            ]);

            if (!auth()->user()->isRegisterFeePaid()) {
                if (!auth()->user()->isStripeEnabled()) {
                    $errors[] = 'Your register fee failed. To access portal features <a href="'. route('billing.card') .'">add your credit card</a>';
                } else {
                    $errors[] = 'Your register fee failed. To access portal features <a href="'. route('billing.card') .'">purchase the product</a>';
                }
            }

            if (count($errors)) {
                View::share('globalErrors', $errors);
            }

            $location = auth()->user()->location;
            if ($location) {
                $company  = $location->company;

                if ($location->payment_required || $company->billable && $location->parent_id == -1) {
                    $locationPaymentRequired =  !auth()->user()->location->payout_method || !auth()->user()->location->payout_method->stripe_payout_method_id ? true : false;
                }

                if ($location->amenities_required) {
                    $amenities = Amenities::orderBy('id', 'ASC')->get();
                    $locationAmenities = AmenitiesLocation::where('location_id', $location->id)->get();

                    $requiredAmenitiesIds    = $amenities->where('required', 1)->pluck('id')->toArray();
                    $filledAmenities         = $locationAmenities->pluck('amenity_id')->toArray();

                    $requiredAmenitiesFilled = [];
                    foreach ($requiredAmenitiesIds as $amenityId) {
                        if (in_array($amenityId, $filledAmenities)) {
                            $requiredAmenitiesFilled[] = $amenityId;
                        }
                    }

                    $glboalLocationAmenities   = [];
                    $amenitiesResponses = $locationAmenities->pluck('responses', 'amenity_id')->toArray();

                    foreach ($amenities->toArray() as $question) {
                        if (isset($amenitiesResponses[$question['id']])) {
                            $glboalLocationAmenities[$question['id']] = $amenitiesResponses[$question['id']];
                        } else {
                            if ($question['type'] == 'boolean') {
                                $glboalLocationAmenities[$question['id']] = null;
                            } elseif ($question['type'] == 'input' || $question['type'] == 'double') {
                                $glboalLocationAmenities[$question['id']] = '';
                            } elseif ($question['type'] == 'select') {
                                $glboalLocationAmenities[$question['id']] = $question['responses'][0];
                            } elseif ($question['type'] == 'checkbox') {
                                $glboalLocationAmenities[$question['id']] = [];
                                foreach ($question['responses'] as $index => $value) {
                                    $glboalLocationAmenities[$question['id']][$index] = false;
                                }
                            }
                        }
                    }

                    if (count($requiredAmenitiesFilled) < count($requiredAmenitiesIds) && auth()->user()->isClubAdmin()) {
                        View::share('globalAmenitiesPopup', true);
                    } else {
                        View::share('globalAmenitiesPopup', false);
                    }

                    View::share('globalAmenities', $amenities->toArray());
                    View::share('glboalLocationAmenities', $glboalLocationAmenities);
                }
            }
        }

        $headerhomeLink = config('app.name', 'Veritap');
        if (auth()->check() && auth()->user()->location && auth()->user()->hasRole('club_admin|club_enterprise|root|insurance'))
            $headerhomeLink = auth()->user()->location->header_home_link;
        else if (auth()->check() && auth()->user()->company)
            $headerhomeLink = auth()->user()->company->name;

        View::share('headerHomeLink', $headerhomeLink);
        View::share('locationPaymentRequired', $locationPaymentRequired);
        View::share('currentDashboardImage', \App\Services\HomePageImages::getLoginImage());
        View::share('currentHomePerson', \App\Services\HomePageImages::getHomepersonImage());

        $globalNotifications = GlobalNotification::where('start_date', '<=', Carbon::now()->format('Y-m-d 00:00:00'))
                                                 ->where('end_date', '>=', Carbon::now()->format('Y-m-d 23:59:59'))
                                                 ->get();
        View::share('globalNotifications', $globalNotifications);

        return $next($request);
    }
}
