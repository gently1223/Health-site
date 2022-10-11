@extends('layouts.auth')

@section('content')
<div class="full-height valign-wrapper">
    <div class="container">
        <div class="card-panel auth-panel">
            <div class="card-header">
                <div class="row">
                    <div class="col s12">
                        <h5 class="center-align margin-0">{{ __('Verify Your Email Address') }}</h5>
                    </div>
                </div>
            </div>

            <div class="card-body">
                @if (session('resent'))
                <div class="row">
                    <div class="col s12 teal-text">{{ __('A fresh verification link has been sent to your email address.') }}</div>
                </div>
                @endif

                <p>
                    {{ __('Before proceeding, please check your email for a verification link.') }}
                    {{ __('If you did not receive the email') }},
                </p>

                <form class="d-inline" method="POST" action="{{ route('verification.resend') }}">
                    @csrf
                    <button type="submit" class="btn btn-link">{{ __('click here to request another') }}</button>.
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
