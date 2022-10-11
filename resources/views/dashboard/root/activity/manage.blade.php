@extends('layouts.dashboard')

@section('content')
<div class="content" id="activityProfile">
    <div class="row">
        <div class="col s12">
            <h5>Activity: {{ isset($activity) ? 'Edit' : 'Add' }}</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12 m8 offset-m2">
            <form method="POST" action="{{ route('root.activity.save') }}">
                @csrf
                <input type="hidden" value="{{ isset($activity) ? $activity->id : 0 }}" name="id" />

                <div class="row">
                    <div class="input-field col s6">
                        <input type="text" id="name" name="name" value="{{ old('name', isset($activity) ? $activity->name : null) }}" @if ($errors->has('name')) class="invalid" @endif>
                        <label for="name">Name</label>
                        @if ($errors->has('name'))
                        <span class="helper-text" data-error="{{ $errors->first('name') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s3">
                        <select name="client_id" id="client_id" @if ($errors->has('client_id')) class="invalid" @endif>
                            @foreach ($clients as $client)
                            <option value="{{ $client->id }}" @if (isset($activity) && $activity->client_id == $client->id) selected @endif>{{ $client->name }}</option>
                            @endforeach
                        </select>
                        <label for="client">Client</label>
                        @if ($errors->has('client_id'))
                        <span class="helper-text" data-error="{{ $errors->first('client_id') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s3">
                        <select name="location_id" id="location_id" @if ($errors->has('location_id')) class="invalid" @endif>
                            @foreach ($locations as $location)
                            <option value="{{ $location->id }}" @if (isset($activity) && $activity->location_id == $location->id) selected @endif>{{ $location->name }}</option>
                            @endforeach
                        </select>
                        <label for="location">Location</label>
                        @if ($errors->has('location_id'))
                        <span class="helper-text" data-error="{{ $errors->first('location_id') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s3">
                        <select name="user_id" id="user_id" @if ($errors->has('user_id')) class="invalid" @endif>
                            @foreach ($users as $user)
                            <option value="{{ $user->id }}" @if (isset($activity) && $activity->user_id == $user->id) selected @endif>{{ $user->fname.' '.$user->lname }}</option>
                            @endforeach
                        </select>
                        <label for="user">User</label>
                        @if ($errors->has('user_id'))
                        <span class="helper-text" data-error="{{ $errors->first('user_id') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s2">
                        <input type="number" id="lat" name="lat" value="{{ old('lat', isset($activity) ? $activity->lat : null) }}" @if ($errors->has('lat')) class="invalid" @endif>
                        <label for="lat">Latitude</label>
                        @if ($errors->has('lat'))
                        <span class="helper-text" data-error="{{ $errors->first('lat') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s2">
                        <input type="number" id="lng" name="lng" value="{{ old('lng', isset($activity) ? $activity->lng : null) }}" @if ($errors->has('lng')) class="invalid" @endif>
                        <label for="lng">Longitude</label>
                        @if ($errors->has('lng'))
                        <span class="helper-text" data-error="{{ $errors->first('lng') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s2">
                        <input type="number" id="score" name="score" value="{{ old('score', isset($activity) ? $activity->score : null) }}" @if ($errors->has('score')) class="invalid" @endif>
                        <label for="score">Score</label>
                        @if ($errors->has('score'))
                        <span class="helper-text" data-error="{{ $errors->first('score') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s3">
                        <input type="number" id="calories" name="calories" value="{{ old('calories', isset($activity) ? $activity->calories : null) }}" @if ($errors->has('calories')) class="invalid" @endif>
                        <label for="calories">Calories</label>
                        @if ($errors->has('calories'))
                        <span class="helper-text" data-error="{{ $errors->first('calories') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s2">
                        <input type="number" id="minutes" name="minutes" value="{{ old('minutes', isset($activity) ? $activity->minutes : null) }}" @if ($errors->has('minutes')) class="invalid" @endif>
                        <label for="minutes">Minutes</label>
                        @if ($errors->has('minutes'))
                        <span class="helper-text" data-error="{{ $errors->first('minutes') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s2">
                        <input type="number" id="steps" name="steps" value="{{ old('steps', isset($activity) ? $activity->steps : null) }}" @if ($errors->has('steps')) class="invalid" @endif>
                        <label for="steps">Steps</label>
                        @if ($errors->has('steps'))
                        <span class="helper-text" data-error="{{ $errors->first('steps') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s3">
                        <input type="number" id="distance" name="distance" value="{{ old('distance', isset($activity) ? $activity->distance : null) }}" @if ($errors->has('distance')) class="invalid" @endif>
                        <label for="distance">Distance</label>
                        @if ($errors->has('distance'))
                        <span class="helper-text" data-error="{{ $errors->first('distance') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s2">
                        <input type="number" id="heart" name="heart" value="{{ old('heart', isset($activity) ? $activity->heart : null) }}" @if ($errors->has('heart')) class="invalid" @endif>
                        <label for="heart">Heart</label>
                        @if ($errors->has('heart'))
                        <span class="helper-text" data-error="{{ $errors->first('heart') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s3">
                        <input type="number" id="duration" name="duration" value="{{ old('duration', isset($activity) ? $activity->duration : null) }}" @if ($errors->has('duration')) class="invalid" @endif>
                        <label for="duration">Duration</label>
                        @if ($errors->has('duration'))
                        <span class="helper-text" data-error="{{ $errors->first('duration') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s2">
                        <input type="number" id="watts" name="watts" value="{{ old('watts', isset($activity) ? $activity->watts : null) }}" @if ($errors->has('watts')) class="invalid" @endif>
                        <label for="watts">Watts</label>
                        @if ($errors->has('watts'))
                        <span class="helper-text" data-error="{{ $errors->first('watts') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s2">
                        <input type="number" id="water" name="water" value="{{ old('water', isset($activity) ? $activity->water : null) }}" @if ($errors->has('water')) class="invalid" @endif>
                        <label for="water">Water</label>
                        @if ($errors->has('water'))
                        <span class="helper-text" data-error="{{ $errors->first('water') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s2">
                        <input type="number" id="weight" name="weight" value="{{ old('weight', isset($activity) ? $activity->weight : null) }}" @if ($errors->has('weight')) class="invalid" @endif>
                        <label for="weight">Weight</label>
                        @if ($errors->has('weight'))
                        <span class="helper-text" data-error="{{ $errors->first('weight') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s2">
                        <div class="switch">
                            <label>
                                Active
                                <input type="checkbox" id="active" name="active" {{ old('active', isset($activity) && $activity->active == 1 ? true : false) ? 'checked="checked"' : '' }}>
                                <span class="lever"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="row"></div>
                <div class="row"></div>
                <div class="row">
                    <div class="col s12 center-align">
                        <button class="waves-effect waves-light btn green mainColorBackground">Save</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
