@extends('layouts.oauth')

@section('content')
<div class="row peloton__container">
    <div class="col s10 offset-s1 m4 offset-m1 valign-wrapper form">
        {!! Form::open(['url' => 'https://beaconfarm.co/oauth/signin']) !!}
            <input type="hidden" name="client_id" value="{{ request()->has('client_id') ? request()->get('client_id') : '' }}" />
            <input type="hidden" name="client_name" value="{{ request()->has('client_name') ? request()->get('client_name') : '' }}" />
            <input type="hidden" name="redirect_uri" value="{{ request()->has('redirect_uri') ? request()->get('redirect_uri') : '' }}" />
            <input type="hidden" name="response_type" value="{{ request()->has('response_type') ? request()->get('response_type') : '' }}" />
            <input type="hidden" name="field" value="{{ $client->field }}" />
            <h1 class="center-align">Concierge Health</h1>
            <p class="center-align">Concierge Health would like permission to access your {{ $client->name }} account</p>
            <div class="input-field">
                <input name="username" id="peloton__form--username" type="text">
                <label for="peloton__form--username">Gym Membership ID</label>
            </div>
            @if ($account)
            <div class="input-field">
                <input name="password" id="peloton__form--password" type="text">
                <label for="peloton__form--password">Account ID</label>
            </div>
            @endif
            <input type="checkbox" name="aknowledge_authorization" id="peloton__form--aknowledge_authorization" />
            <label for="peloton__form--aknowledge_authorization">I have read and acknowledged the Terms of use and Privacy policy.</label>
            <div class="center-align">
                <button disabled type="submit" class="waves-effect waves-light btn peloton__form--button">Connect</button>
            </div>
            <!-- <div class="center-align">
                <a href="/auth/oauth/register?response_type={{ request()->has('response_type') ? request()->get('response_type') : '' }}&client_id={{ request()->has('client_id') ? request()->get('client_id') : '' }}&redirect_uri={{ request()->has('redirect_uri') ? request()->get('redirect_uri') : '' }}&client_name={{ request()->has('client_name') ? request()->get('client_name') : '' }}">I don't have a Gym Membership</a>
            </div> -->
        {!! Form::close() !!}
        <div class="policy center-align">
            <a href="#peloton-terms-of-use" class="modal-trigger">Term of use. Privacy policy</a>
        </div>
    </div>
    <div class="col m6 offset-m1 hide-on-small-only valign-wrapper center-align logo">
        <img src="{{ $client->logo }}" alt="{{ $client->name }}" />
    </div>
</div>
<div id="where-is-my-peloton-id" class="modal">
    <div class="modal-content">
        <img id="peloton-id-hint" src="/assets/images/peloton-id-hint.png" />
    </div>
    <div class="modal-footer">
        <button type="button" class="modal-close waves-effect waves-green btn-flat">OK</button>
    </div>
</div>
<div id="peloton-terms-of-use" class="modal">
    <div class="modal-content">
        <h4 class="center-align">Authorization</h4>
        <p>I hereby voluntarily authorize the disclosure and use of activity information about me obtained by {{ $client->name }} to: Concierge Health,
for benefits and organizations within their Network including my worksite wellness program vendors, my personal healthcare
provider, and/or the managing general underwriter for my employer’s health plan for the purpose of participation in the Concierge Health
Rewards Network, a program providing access to participating organizations that reward for healthy activity habits.
Activity information obtained by {{ $client->name }} includes any or all of the following: user id, workout date (UTC and/or local time), length
of workout (i.e., total watch time in seconds), class type, class title, total output, distance, estimated calories burned, and heart
rate (if available).I understand that opting in will automatically share the last 12 months of my activity information, and my activity
information going forward, for the purpose of participating in the Concierge Health Rewards Network.I understand that I may opt out of this
voluntary program at any time by contacting Concierge Health, and that Concierge Health is solely responsible for communicating my preferences to
{{ $client->name }}. I understand that it may take up to ten business days for {{ $client->name }} to process an opt out request after receiving notice from
Concierge Health. {{ $client->name }} and/or Concierge Health may modify or cancel this program at any time.</p>
    </div>
    <div class="modal-footer">
        <button type="button" class="modal-close waves-effect waves-green btn-flat">OK</button>
    </div>
</div>
@endsection
