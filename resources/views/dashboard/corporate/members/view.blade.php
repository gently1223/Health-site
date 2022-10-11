@extends('layouts.dashboard')

@section('content')
<div class="memberDashboard" id="memberDashboard" ref="container">
    <div class="memberDashboard__left">
        <div class="memberDashboard__avatar" style="background-image: url('{{ $member->photo ? $member->photo : 'https://d2x5ku95bkycr3.cloudfront.net/App_Themes/Common/images/profile/0_200.png' }}')"></div>

        <div class="memberDashboard__section memberDashboard__basic">
            <div class="memberDashboard__title">Basic data</div>
            <ul>
                <li>
                    <span><b>Member Since</b></span>{{ $member->created_date }}
                </li>

                <li>
                    <span><b>Birthday</b></span>{{ $member->birthday_date }}
                </li>
            </ul>
        </div>

        @if (!auth()->user()->isMember() && $member->program)
        <div class="memberDashboard__section memberDashboard__basic">
        <div class="memberDashboard__title">Insurance data</div>
         <ul>
                <li>
                    <span><b>Program</b></span>{{ $member->program->name }}
                </li>

                <li>
                    <span><b>Account</b></span>{{ $member->member_program ? $member->member_program->membership: 'None' }}
                </li>
            </ul>
        </div>

        <div class="memberDashboard__section memberDashboard__basic">
        <div class="memberDashboard__title">Company data</div>
         <ul>
               <li>
                    <span><b>Name</b></span>{{ $member->company? $member->company->name: 'None' }}
                </li>
            </ul>
        </div>


        @endif
    </div>
    <div class="memberDashboard__right">
        <div class="memberDashboard__tabs">
            <span data-target="memberDashboard__checkins" :class="{'active': tab == 'calendar'}" @click="switchTab('calendar')">Calendar</span>
            <span data-target="memberDashboard__wellness" :class="{'active': tab == 'wellness'}" @click="switchTab('wellness')">Wellness</span>

            @if (auth()->user()->isAdmin())
            <div align="right" style="padding-right: 16px; padding-top: 17px">
                <a href="{{ route($isEnterprise ? 'enterprise.members.edit' : 'corporate.members.edit', ['memberId' => $member->id]) }}">Manage</a>
            </div>
            @endif
        </div>

        <div class="memberDashboard__user">
            @if (!auth()->user()->isMember())
            <button type="button" class="right waves-effect waves-light blue btn btn-primary mainColorBackground" @click="openCheckinModal">Checkin</button>
            @endif

            <span>{{ $member->displayName }}</span>
            <i>{{ $member->membership }}</i>
            @if ($member->eligibility_status)
            <b class="{{ $member->eligible_color }}">{{ $member->eligibility_status }}</b>
            @endif
        </div>

        @include('dashboard.company.members.dashboard.calendar')
        @include('dashboard.company.members.dashboard.wellness')
    </div>

    <div class="modal modal-small" ref="checkinDateModal">
        <div class="modal-content">
            <h5 class="center-align">Checkin Member</h5>
            <div class="row margin-0">
                <div class="col s12 input-field">
                    <input type="text" class="datepicker" ref="checkinDateDatepicker">
                    <label for="email">Pick a date</label>
                </div>
            </div>
        </div>
        <div class="modal-footer modal-footer-styled">
            <div class="padding-0-20-20 overflow-hidden">
                <button type="button" class="margin-0 left waves-effect waves-dark btn-flat modal-close">Cancel</button>
                <button type="button" class="margin-0 right waves-effect waves-light blue btn btn-primary mainColorBackground" @click="checkinMember">Confirm</button>
            </div>
        </div>
    </div>
</div>
@endsection

@push('js')
<script src="{{ asset('js/Chart.min.js') }}"></script>
{{-- <script src="{{ asset('assets/js/Chart.bundle.min.js') }}"></script> --}}
<script>
window.Laravel.member = {!! json_encode([
    'id'       => $member->id,
    'start'    => $start,
    'checkins' => $checkins,
    'wellness' => $wellness,
]) !!};
window.Laravel.isEnterprise = {!! $isEnterprise ? 1 : 0 !!};
</script>
<script src="{{ asset('js/pages/memberDashboard.js') }}?v=1.1"></script>
@endpush
