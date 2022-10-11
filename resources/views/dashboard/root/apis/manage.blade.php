@extends('layouts.dashboard')

@section('content')
<div class="content" id="apiProfile">
    <div class="row">
        <div class="col s12">
            <h5>Api: {{ isset($api) ? 'Edit' : 'Add' }}</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12 m8 offset-m2">
            <form method="POST" action="{{ route('root.apis.save') }}">
                @csrf
                <input type="hidden" value="{{ isset($api) ? $api->id : 0 }}" name="id" />

                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" id="name" name="name" value="{{ old('name', isset($api) ? $api->name : null) }}" @if ($errors->has('name')) class="invalid" @endif>
                        <label for="name">Name</label>
                        @if ($errors->has('name'))
                        <span class="helper-text" data-error="{{ $errors->first('name') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" id="apikey" name="apikey" value="{{ old('apikey', isset($api) ? $api->apikey : null) }}" @if ($errors->has('apikey')) class="invalid" @endif>
                        <label for="apikey">Api Key</label>
                        @if ($errors->has('apikey'))
                        <span class="helper-text" data-error="{{ $errors->first('apikey') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s6">
                        <select name="company_id" id="company_id" @if ($errors->has('company_id')) class="invalid" @endif>
                            <option value="">Choose Company</option>
                            @foreach ($companies as $company)
                            <option value="{{ $company->id }}" @if (isset($api) && $api->company_id == $company->id) selected @endif>{{ $company->name }}</option>
                            @endforeach
                        </select>
                        <label for="company_id">Company</label>
                        @if ($errors->has('company_id'))
                        <span class="helper-text" data-error="{{ $errors->first('company_id') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s6">
                        <input type="text" id="image" name="image" value="{{ old('image', isset($api) ? $api->image : null) }}" @if ($errors->has('image')) class="invalid" @endif>
                        <label for="image">Logo Link</label>
                        @if ($errors->has('image'))
                        <span class="helper-text" data-error="{{ $errors->first('image') }}"></span>
                        @endif
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
