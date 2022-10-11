@extends('layouts.auth')

@section('content')
<div class="full-height valign-wrapper">
    <div class="container">
        <div class="card-panel auth-panel">
            <div class="card-header">
                <div class="row">
                    <div class="col s12">
                        <h5 class="center-align margin-0">{{ __('Reset Password') }}</h5>
                    </div>
                </div>
            </div>

            <div class="card-body">
                @if (session('status'))
                <div class="row">
                    <div class="col s12 teal-text">{{ session('status') }}</div>
                </div>
                @endif

                <form method="POST" action="{{ route('password.email') }}">
                    @csrf

                    <div class="row">
                        <div class="input-field col s12">
                            <input class="validate @error('email') invalid @enderror" id="email" type="email" name="email" value="{{ old('email') }}" required autocomplete="email" autofocus>
                            <label for="email">{{ __('E-Mail') }}</label>
                            @error('email')
                            <span class="helper-text" data-error="{{ $message }}"></span>
                            @enderror
                        </div>
                    </div>

                    <div class="row">
                        <div class="col s12">
                            <button type="submit" class="btn btn-primary">
                                {{ __('Send Password Reset Link') }}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
