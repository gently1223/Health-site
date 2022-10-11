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
                <form method="POST" action="{{ route('password.update') }}">
                    @csrf

                    <input type="hidden" name="token" value="{{ $token }}">
                    <input type="hidden" name="email" value="{{ $email }}"/>
                    @if ($errors->count())
                    <div class="error">
                        <span>{{ $errors->first() }}</span>
                    </div>
                    @endif

                    <div class="row">
                        <div class="inputField">
                            <label for="email">Email</label>
                            <input class="browser-default" id="email" type="email" value="{{ $email }}" disabled>
                        </div>

                        <div class="inputField">
                            <label for="email">Password</label>
                            <input class="browser-default" id="password" type="password" name="password" required autocomplete="new-password" autofocus>
                        </div>

                        <div class="inputField">
                            <label for="email">Reset Password</label>
                            <input class="browser-default" id="password-confirm" type="password" name="password_confirmation" required autocomplete="new-password">
                        </div>
                    </div>

                    <div class="row">
                        <div class="col s12">
                            <button type="submit" class="button">Reset Password</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
