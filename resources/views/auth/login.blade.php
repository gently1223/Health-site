@extends('layouts.auth')

@section('content')
<div id="authPage">
    <div class="authPageBackgroundImage" style="background-image: url('/images/loginbackgrounds/{{ isset($currentDashboardImage) ? $currentDashboardImage : '1' }}.jpg');"></div>
    <div class="authPageWrapper">
        <div class="full-height valign-wrapper">
            <div class="authPageForm">
                <div class="greetings">
                    <h1>Welcome to <span>Concierge Health</span></h1>
                    <div class="avatar" v-bind:style="{backgroundImage: 'url('+ avatar + ')'}"></div>
                </div>
                <form method="POST" action="{{ route('login') }}">
                    @csrf
                    <div class="inputField">
                        <label for="email">Email</label>
                        <input class="browser-default" id="email" type="email" name="email" value="{{ old('email') }}" required autocomplete="email" autofocus @change="checkUserExists" v-model="email">
                    </div>

                    <div class="inputField">
                        <label for="password">Password</label>
                        <input class="browser-default" id="password" type="password" name="password" required autocomplete="current-password">
                        <a class="helper" href="{{ route('password.request') }}" @click="showForgotPopup">Forgot?</a>
                    </div>

                    @if ($errors->count())
                    <div class="error">
                        <span>{{ $errors->first() }}</span>
                    </div>
                    @endif

                    <button type="submit" class="button">Sign in</button>
                </form>
                <div class="authFormFooter">
                    <h2>Don't have an account?</h2>
                    <a href="{{ route('register') }}">Register Now</a>
                </div>
                <div class="authDownload">
                    <a href="#" class="appStore"></a>
                    <span><img src="/images/qr-code.jpg" alt="QR Code link" width="70" /></span>
                    <a href="#" class="googlePlay"></a>
                </div>
            </div>
        </div>
    </div>

    <div class="popup" :class="{popupActive: forgotPopup.open}">
        <div class="popupClose" @click="closeForgotPopup"></div>
        <div class="popupBlock">
            <div class="close" @click="closeForgotPopup">&times;</div>
            <h2>Reset your password</h2>
            <p>Enter the email you used to register your account, and we'll send you a link to create new password.</p>
            <form method="POST" action="{{ route('password.email') }}">
                @csrf
                <div class="inputField">
                    <input class="browser-default" type="email" name="email">
                </div>
                <br>
                <div class="popupButtons">
                    <button type="submit" class="button grey">Reset password</button>
                    <button type="button" class="button flat" @click="closeForgotPopup">Back to login</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@push('js')
<script>
@if (Session::has('status'))
window.Laravel.status = "{{ Session::get('status') }}";
@endif
</script>
<script src="{{ asset('js/auth.js') }}" defer></script>
@endpush
