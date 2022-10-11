@extends('layouts.dashboard')

@section('content')
<div class="content" id="roleProfile">
    <div class="row">
        <div class="col s12">
            <h5>Company: {{ isset($role) ? 'Edit' : 'Add' }}</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12 m8 offset-m2">
            <form method="POST" action="{{ route('root.roles.save') }}">
                @csrf
                <input type="hidden" value="{{ isset($role) ? $role->id : 0 }}" name="id" />

                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" id="name" name="name" value="{{ old('name', isset($role) ? $role->name : null) }}" @if ($errors->has('name')) class="invalid" @endif>
                        <label for="name">Name</label>
                        @if ($errors->has('name'))
                        <span class="helper-text" data-error="{{ $errors->first('name') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" id="slug" name="slug" value="{{ old('slug', isset($role) ? $role->slug : null) }}" @if ($errors->has('slug')) class="invalid" @endif>
                        <label for="slug">Slug</label>
                        @if ($errors->has('slug'))
                        <span class="helper-text" data-error="{{ $errors->first('slug') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" id="url" name="url" value="{{ old('url', isset($role) ? $role->url : null) }}" @if ($errors->has('url')) class="invalid" @endif>
                        <label for="url">Image Link</label>
                        @if ($errors->has('url'))
                        <span class="helper-text" data-error="{{ $errors->first('url') }}"></span>
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
