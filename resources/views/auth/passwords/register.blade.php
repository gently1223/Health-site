@extends('layouts.auth')

@section('content')
<div class="full-height valign-wrapper">
    <div class="container">
        <div class="card-panel auth-panel">
            <div class="card-header">
                <div class="row">
                    <div class="col s12">
                        <h5 class="center-align margin-0">{{ __('Register') }}</h5>
                    </div>
                </div>
            </div>

            <div class="card-body">
                <form method="POST" action="{{ route('register') }}">
                    @csrf

                    <div class="row">
                        <div class="input-field col s12">
                            <input class="validate @error('first_name') invalid @enderror" id="first_name" type="text" name="first_name" required>
                            <label for="first_name">{{ __('First Name') }}</label>
                            @error('first_name')
                            <span class="helper-text" data-error="{{ $message }}"></span>
                            @enderror
                        </div>

                        <div class="input-field col s12">
                            <input class="validate @error('last_name') invalid @enderror" id="last_name" type="text" name="last_name" required>
                            <label for="last_name">{{ __('Last Name') }}</label>
                            @error('last_name')
                            <span class="helper-text" data-error="{{ $message }}"></span>
                            @enderror
                        </div>

                        <div class="input-field col s12">
                            <input class="validate @error('email') invalid @enderror" id="email" type="email" name="email" value="{{ old('email') }}" required autocomplete="email">
                            <label for="email">{{ __('E-Mail') }}</label>
                            @error('email')
                            <span class="helper-text" data-error="{{ $message }}"></span>
                            @enderror
                        </div>

                        <div class="input-field col s12">
                            <input class="validate @error('password') invalid @enderror" id="password" type="password" name="password" required autocomplete="new-password">
                            <label for="password">{{ __('Password') }}</label>
                            @error('password')
                            <span class="helper-text" data-error="{{ $message }}"></span>
                            @enderror
                        </div>

                        <div class="input-field col s12">
                            <input class="validate @error('password') invalid @enderror" id="password-confirm" type="password" name="password_confirmation" required autocomplete="new-password">
                            <label for="password-confirm">{{ __('Reset Password') }}</label>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col s12">
                            <button type="submit" class="btn btn-primary">
                                {{ __('Register') }}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
