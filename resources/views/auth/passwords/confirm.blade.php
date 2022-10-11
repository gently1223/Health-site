@extends('layouts.auth')

@section('content')
<div class="full-height valign-wrapper">
    <div class="container">
        <div class="card-panel auth-panel">
            <div class="card-header">
                <div class="row">
                    <div class="col s12">
                        <h5 class="center-align margin-0">{{ __('Confirm Password') }}</h5>
                    </div>
                </div>
            </div>

            <div class="card-body">
                {{ __('Please confirm your password before continuing.') }}

                <form method="POST" action="{{ route('password.confirm') }}">
                    @csrf

                    <div class="row">
                        <div class="input-field col s12">
                            <input class="validate @error('password') invalid @enderror" id="password" type="password" name="password" required autocomplete="current-password">
                            <label for="password">{{ __('Password') }}</label>
                            @error('password')
                            <span class="helper-text" data-error="{{ $message }}"></span>
                            @enderror
                        </div>
                    </div>

                    <div class="row">
                        <div class="col s12">
                            <button type="submit" class="btn btn-primary">
                                {{ __('Confirm Password') }}
                            </button>

                            @if (Route::has('password.request'))
                                <a class="btn btn-link" href="{{ route('password.request') }}">
                                    {{ __('Forgot Your Password?') }}
                                </a>
                            @endif
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
