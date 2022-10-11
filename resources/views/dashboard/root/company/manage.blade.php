@extends('layouts.dashboard')

@section('content')
<div class="content" id="companyProfile">
    <div class="row">
        <div class="col s12">
            <h5>Company: {{ isset($company) ? 'Edit' : 'Add' }}</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12 m8 offset-m2">
            <form method="POST" action="{{ route('root.company.save') }}">
                @csrf
                <input type="hidden" value="{{ isset($company) ? $company->id : 0 }}" name="id" />

                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" id="name" name="name" value="{{ old('name', isset($company) ? $company->name : null) }}" @if ($errors->has('name')) class="invalid" @endif>
                        <label for="name">Name</label>
                        @if ($errors->has('name'))
                        <span class="helper-text" data-error="{{ $errors->first('name') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s3">
                        <select name="company_type" id="company_type" @if ($errors->has('company_type')) class="invalid" @endif>
                            @foreach ($types as $type)
                            <option value="{{ $type->id }}" @if (isset($company) && $company->company_type == $type->id) selected @endif>{{ $type->name }}</option>
                            @endforeach
                        </select>
                        <label for="company_type">Company Type</label>
                        @if ($errors->has('company_type'))
                        <span class="helper-text" data-error="{{ $errors->first('company_type') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s3 offset-m2">
                        <div class="switch">
                            <label>
                                Compressed
                                <input type="checkbox" id="compressed" name="compressed" {{ old('compressed', isset($company) && $company->compressed == 1 ? true : false) ? 'checked="checked"' : '' }}>
                                <span class="lever"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s3">
                        <div class="switch">
                            <label>
                                Billable
                                <input type="checkbox" id="billable" name="billable" {{ old('billable', isset($company) && $company->billable == 1 ? true : false) ? 'checked="checked"' : '' }}>
                                <span class="lever"></span>
                            </label>
                        </div>
                    </div>
                    <div class="input-field col s3">
                        <div class="switch">
                            <label>
                                CSV Comma
                                <input type="checkbox" id="csv_delimiter" name="csv_delimiter" {{ old('csv_delimiter', isset($company) && $company->csv_delimiter ? true : false) ? 'checked="checked"' : '' }}>
                                <span class="lever"></span>
                            </label>
                        </div>
                    </div>
                    <div class="input-field col s3">
                        <div class="switch">
                            <label>
                                Amenities
                                <input type="checkbox" id="amenities_required" name="amenities_required" {{ old('amenities_required', isset($company) && $company->amenities_required == 1 ? true : false) ? 'checked="checked"' : '' }}>
                                <span class="lever"></span>
                            </label>
                        </div>
                    </div>
                    <div class="input-field col s3">
                        <div class="switch">
                            <label>
                                Multi Day Checkin
                                <input type="checkbox" id="multi_day_checkin" name="multi_day_checkin" {{ old('multi_day_checkin', isset($company) && $company->multi_day_checkin == 1 ? true : false) ? 'checked="checked"' : '' }}>
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
