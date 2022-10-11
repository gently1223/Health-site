@extends('layouts.dashboard')

@section('content')
<div class="content">
    <div class="row">
        <div class="col s12">
            <h5>Locations: {{ isset($location) ? 'Edit' : 'Add' }}</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <form method="post" action="{{ $enterpriseLocation ? route('enterprise.locations.save') : route('club.locations.save') }}">
                @csrf
                @if (isset($location))
                <input type="hidden" name="location_id" value="{{ $location->id }}" />
                @endif

                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" name="club_id" id="club_id" value="{{ old('club_id', isset($location) ? $location->club_id : null) }}">
                        <label for="club_id">Club ID</label>
                    </div>
                </div>

                <div class="row">
                    <div class="input-field col {{ auth()->user()->hasRole('root') ? 's8' : 's12' }}">
                        <input type="text" name="name" id="name" value="{{ old('name', isset($location) ? $location->name : null) }}">
                        <label for="name">Name</label>
                    </div>

                    @if (auth()->user()->hasRole('root'))
                    <div class="input-field col s4">
                        <div class="switch right switch-near-inputs">
                            <label>
                                Provisioned
                                <input type="checkbox" id="provisioned" name="provisioned" {{ old('provisioned', isset($location) && $location->provisioned == 1 ? true : false) ? 'checked="checked"' : '' }}>
                                <span class="lever"></span>
                            </label>
                        </div>
                    </div>
                    @endif
                </div>

                <div class="row">
                    <div class="input-field col s4">
                        <input type="text" name="state" id="state" id="state" value="{{ old('state', isset($location) ? $location->state : null) }}">
                        <label for="state">State</label>
                    </div>

                    <div class="input-field col s4">
                        <input type="text" name="city" id="city" id="city" value="{{ old('city', isset($location) ? $location->city : null) }}">
                        <label for="city">City</label>
                    </div>

                    <div class="input-field col s4">
                        <input type="text" name="postal" id="postal" id="postal" value="{{ old('postal', isset($location) ? $location->postal : null) }}">
                        <label for="postal">Postal</label>
                    </div>
                </div>

                <div class="row">
                    <div class="input-field col s6">
                        <input type="text" name="address" id="address" id="address" value="{{ old('address', isset($location) ? $location->address : null) }}">
                        <label for="address">Address</label>
                    </div>

                    <div class="input-field col s6">
                        <input type="text" name="phone" id="phone" id="phone" value="{{ old('phone', isset($location) ? $location->phone : null) }}">
                        <label for="phone">Phone</label>
                    </div>
                </div>

                @if (auth()->user()->hasRole('root'))
                <div class="row">
                    <div class="input-field col s6">
                        <input type="text" name="lat" id="lat" id="lat" value="{{ old('lat', isset($location) ? $location->lat : null) }}">
                        <label for="lat">Latitude</label>
                    </div>

                    <div class="input-field col s6">
                        <input type="text" name="lng" id="lng" id="lng" value="{{ old('lng', isset($location) ? $location->lng : null) }}">
                        <label for="lng">Longitude</label>
                    </div>
                </div>
                @endif
                @if (auth()->user()->hasRole('root'))
                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" name="franchise" id="franchise" id="franchise" value="{{ old('franchise', isset($location) ? $location->franchise : null) }}">
                        <label for="franchise">Franchise</label>
                    </div>
                </div>
                @endif

                <div class="row">
                    <div class="col s12 center-align">
                        <button class="waves-effect waves-light btn green mainColorBackground" type="submit">Save</button>
                    </div>
                </div>

            </form>
        </div>
    </div>
</div>
@endsection
