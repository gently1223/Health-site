@extends('layouts.dashboard')

@section('content')
<div id="rootAmenities">
    <div class="row">
        <div class="input-field col s12">
            <h5 class="left">Edit Amenity: {{ $amenity->title }}</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <form method="post" action="{{ route('root.amenities.edit', $amenity->id) }}">
                @csrf
                <div class="row">
                    <div class="input-field col s6">
                        <input type="text" name="title" id="title" value="{{ old('title', isset($amenity) ? $amenity->title : null) }}" @if ($errors->has('title')) class="invalid" @endif>
                        <label for="title">Title</label>
                        @if ($errors->has('title'))
                        <span class="helper-text" data-error="{{ $errors->first('title') }}"></span>
                        @endif
                    </div>

                    <div class="input-field col s6 m3">
                        <div class="switch right switch-near-inputs">
                            <label>
                                Non-required
                                <input type="checkbox" name="required" {{ old('required', isset($amenity) && $amenity->required ? true : false) ? 'checked="checked"' : '' }}>
                                <span class="lever"></span>
                                Required
                            </label>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="input-field col s12">
                        <select name="type" id="type">
                            <option value="input" @if (old('type', isset($amenity) ? $amenity->type : 'input') == 'input') selected @endif>Input</option>
                            <option value="boolean" @if (old('type', isset($amenity) ? $amenity->type : 'input') == 'boolean') selected @endif>Yes/No</option>
                            <option value="select" @if (old('type', isset($amenity) ? $amenity->type : 'input') == 'select') selected @endif>Select</option>
                            <option value="checkbox" @if (old('type', isset($amenity) ? $amenity->type : 'input') == 'checkbox') selected @endif>Multiple options</option>
                            <option value="description" @if (old('type', isset($amenity) ? $amenity->type : 'input') == 'description') selected @endif>Description</option>
                            <option value="double" @if (old('type', isset($amenity) ? $amenity->type : 'input') == 'double') selected @endif>Double</option>
                        </select>
                        <label for="type">Type</label>
                    </div>
                </div>

                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" name="responses" id="responses" value="{{ old('responses', isset($amenity) ? $amenity->responseFormatted : null) }}" @if ($errors->has('responses')) class="invalid" @endif>
                        <label for="responses">Responses ("Select"/"Multiple options" types allowed, separate responses with comma)</label>
                        @if ($errors->has('responses'))
                        <span class="helper-text" data-error="{{ $errors->first('responses') }}"></span>
                        @endif
                    </div>
                </div>

                <div class="row">
                    <div class="input-field col s12">
                        <textarea name="description" id="description" class="materialize-textarea">{{ old('responses', isset($amenity) ? $amenity->description : '') }}</textarea>
                        <label for="description">Description</label>
                        @if ($errors->has('description'))
                        <span class="helper-text" data-error="{{ $errors->first('description') }}"></span>
                        @endif
                    </div>
                </div>

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

@push('js')
@endpush
