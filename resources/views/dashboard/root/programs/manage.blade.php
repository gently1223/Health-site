@extends('layouts.dashboard')

@section('content')
<div class="content" id="programProfile">
    <div class="row">
        <div class="col s12">
            <h5>Programs: {{ isset($program) ? 'Edit' : 'Add' }}</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12 m8 offset-m2">
            <form method="POST" action="{{ route('root.programs.save') }}">
                @csrf
                <input type="hidden" value="{{ isset($program) ? $program->id : 0 }}" name="id" />

                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" id="name" name="name" value="{{ old('name', isset($program) ? $program->name : null) }}" @if ($errors->has('name')) class="invalid" @endif>
                        <label for="name">Name</label>
                        @if ($errors->has('name'))
                        <span class="helper-text" data-error="{{ $errors->first('name') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12">
                        <textarea name="desc" id="desc" class="materialize-textarea">{{ old('responses', isset($program) ? $program->desc : '') }}</textarea>
                        <label for="desc">Description</label>
                        @if ($errors->has('desc'))
                        <span class="helper-text" data-error="{{ $errors->first('desc') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s6">
                        <input type="url" id="url" name="url" value="{{ old('url', isset($program) ? $program->url : null) }}" @if ($errors->has('url')) class="invalid" @endif>
                        <label for="url">Image URL</label>
                        @if ($errors->has('url'))
                        <span class="helper-text" data-error="{{ $errors->first('url') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s6">
                        <input type="url" id="web" name="web" value="{{ old('web', isset($program) ? $program->web : null) }}" @if ($errors->has('web')) class="invalid" @endif>
                        <label for="web">Website URL</label>
                        @if ($errors->has('web'))
                        <span class="helper-text" data-error="{{ $errors->first('web') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s4">
                        <input type="text" id="group" name="group" value="{{ old('group', isset($program) ? $program->group : null) }}" @if ($errors->has('group')) class="invalid" @endif>
                        <label for="group">Group</label>
                        @if ($errors->has('group'))
                        <span class="helper-text" data-error="{{ $errors->first('group') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s4">
                        <input type="number" id="type" name="type" value="{{ old('type', isset($program) ? $program->type : null) }}" @if ($errors->has('type')) class="invalid" @endif>
                        <label for="type">Type</label>
                        @if ($errors->has('type'))
                        <span class="helper-text" data-error="{{ $errors->first('type') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s4">
                        <input type="number" id="status" name="status" value="{{ old('status', isset($program) ? $program->status : null) }}" @if ($errors->has('status')) class="invalid" @endif>
                        <label for="status">Status</label>
                        @if ($errors->has('status'))
                        <span class="helper-text" data-error="{{ $errors->first('status') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s6">
                        <input type="text" id="header" name="header" value="{{ old('header', isset($program) ? $program->header : null) }}" @if ($errors->has('header')) class="invalid" @endif>
                        <label for="header">Header</label>
                        @if ($errors->has('header'))
                        <span class="helper-text" data-error="{{ $errors->first('header') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s2"></div>
                    <div class="input-field col s2">
                        <div class="switch">
                            <label>
                                Valid Email
                                <input type="checkbox" id="valid_email" name="valid_email" {{ old('valid_email', isset($program) && $program->valid_email === 'true' ? true : false) ? 'checked="checked"' : '' }}>
                                <span class="lever"></span>
                            </label>
                        </div>
                    </div>
                    <div class="input-field col s2">
                        <div class="switch">
                            <label>
                                Locked
                                <input type="checkbox" id="locked" name="locked" {{ old('locked', isset($program) && $program->locked == 1 ? true : false) ? 'checked="checked"' : '' }}>
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
