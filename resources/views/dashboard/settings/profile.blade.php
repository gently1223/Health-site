@extends('layouts.dashboard')

@section('content')
<div class="content" id="employeeProfile">
    <div class="row">
        <div class="col s12 m8 offset-m2">
            <h5>Profile</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12 m8 offset-m2">
            <form method="POST" action="{{ route('settings.profile') }}">
                @csrf
                <div class="row">
                    <div class="input-field col s12">
                        <i class="material-icons prefix grey-text text-darken-1">email</i>
                        <input type="email" id="email" name="email" value="{{ old('email', auth()->user()->email) }}" @if ($errors->has('email')) class="invalid" @endif>
                        <label for="email">Email address</label>
                        @if ($errors->has('email'))
                        <span class="helper-text" data-error="{{ $errors->first('email') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12 m6">
                        <i class="material-icons prefix grey-text text-darken-1">portrait</i>
                        <input type="text" id="first_name" name="first_name" value="{{ old('first_name', auth()->user()->fname) }}" @if ($errors->has('first_name')) class="invalid" @endif>
                        <label for="first_name">First Name</label>
                        @if ($errors->has('first_name'))
                        <span class="helper-text" data-error="{{ $errors->first('first_name') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s12 m6">
                        <i class="material-icons prefix grey-text text-darken-1">portrait</i>
                        <input type="text" id="last_name" name="last_name" value="{{ old('last_name', auth()->user()->lname) }}" @if ($errors->has('last_name')) class="invalid" @endif>
                        <label for="last_name">Last Name</label>
                        @if ($errors->has('last_name'))
                        <span class="helper-text" data-error="{{ $errors->first('last_name') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12">
                        <i class="material-icons prefix grey-text text-darken-1">call</i>
                        <input type="text" id="phone" name="phone" value="{{ old('phone', auth()->user()->phone) }}">
                        <label for="phone">Phone Number</label>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12">
                        <i class="material-icons prefix grey-text text-darken-1">cake</i>
                        <input type="text" id="birthday" name="birthday" value="{{ old('birthday', auth()->user()->birthday) }}" @if ($errors->has('birthday')) class="invalid" @endif>
                        <label for="birthday">Birthday (YYYY-MM-DD)</label>
                        @if ($errors->has('birthday'))
                        <span class="helper-text" data-error="{{ $errors->first('birthday') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12 m6">
                        <i class="material-icons prefix grey-text text-darken-1">security</i>
                        <input type="password" id="password" name="password" @if ($errors->has('password')) class="invalid" @endif>
                        <label for="password">Password</label>
                        @if ($errors->has('password'))
                        <span class="helper-text" data-error="{{ $errors->first('password') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s12 m6">
                        <i class="material-icons prefix grey-text text-darken-1">security</i>
                        <input type="password" id="password_confirmation" name="password_confirmation">
                        <label for="password_confirmation">Confirm Password</label>
                    </div>
                </div>
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
