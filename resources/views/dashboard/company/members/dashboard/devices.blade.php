<div class="memberDashboard__tab" id="memberDashboard__devices" v-if="tab == 'devices'">
    <div class="row">
        <div class="col s6">
            <h4>MyWellness Account</h4>
            <a v-if="!devices.mywellness" class="concierge__button waves-effect blue waves-light btn btn-primary" href="{{ route('member.device.mywellness.oauth', $member->id) }}">Connect</a>
            <a v-else class="concierge__button waves-effect blue waves-light btn btn-primary" href="{{ route('member.device.mywellness.revoke', $member->id) }}">Revoke Access</a>
        </div>
    </div>
    {{-- <div class="col s6 input-field">
        <input id="memberDashboard__device--gymfarm_id" value="{{ $member->gymfarm_id }}" type="text">
        <label for="memberDashboard__device--gymfarm_id">{{ trans('concierge.device.my_concierge_health') }}</label>
    </div>

    <div class="col s6 input-field">
        <input id="memberDashboard__device--humana" value="{{ $member->humana_id }}" type="text">
        <label for="memberDashboard__device--humana">{{ trans('concierge.device.humana') }}</label>
    </div>

    <div class="col s6 input-field">
        <input id="memberDashboard__device--fod_id" value="{{ $member->fod_id }}" type="text">
        <label for="memberDashboard__device--fod_id">{{ trans('concierge.device.fitness_on_demand') }}</label>
    </div>

    <div class="col s6 input-field">
        <input id="memberDashboard__device--echelon_id" value="{{ $member->echelon_id }}" type="text">
        <label for="memberDashboard__device--echelon_id">{{ trans('concierge.device.echelon') }}</label>
    </div>

    <div class="col s6 input-field">
        <input id="memberDashboard__device--peloton_id" value="{{ $member->peloton_id }}" type="text">
        <label for="memberDashboard__device--peloton_id">{{ trans('concierge.device.peloton') }}</label>
    </div>

    <div class="col s6 input-field">
        <input id="memberDashboard__device--memnum" value="{{ $member->memnum }}" type="text">
        <label for="memberDashboard__device--memnum">{{ trans('concierge.device.gym_membership') }}</label>
    </div>

    <div class="col s6 input-field">
        <input id="memberDashboard__device--heart_band_id" value="{{ $member->nike_user }}" type="text">
        <label for="memberDashboard__device--heart_band_id">{{ trans('concierge.device.heart_rate') }}</label>
    </div>

    <div class="col s6 input-field">
        <input id="memberDashboard__device--ash_id" value="{{ $member->ash_id }}" type="text">
        <label for="memberDashboard__device--ash_id">{{ trans('concierge.device.american_specialy') }}</label>
    </div>

    <div class="col s6 input-field">
        <input id="memberDashboard__device--optum_id" value="{{ $member->optum_id }}" type="text">
        <label for="memberDashboard__device--optum_id">{{ trans('concierge.device.optum') }}</label>
    </div>

    <div class="col s6 input-field">
        <input id="memberDashboard__device--vsp_id" value="{{ $member->vsp_id }}" type="text">
        <label for="memberDashboard__device--vsp_id">{{ trans('concierge.device.vsp') }}</label>
    </div>

    <hr />
    <div class="col s6">
        <h4>Fitbit Device</h4>
        @if ($member->fitbit_join == 0)
        <a class="concierge__button waves-effect blue waves-light btn btn-primary" href="{{ route('concierge.member.device.fitbit.oauth', $member->id) }}">Connect</a>
        @else
        <a class="concierge__button waves-effect blue waves-light btn btn-primary" href="{{ route('concierge.member.device.fitbit.revoke', $member->id) }}">Revoke Access</a>
        @endif
    </div> --}}

    {{-- <div class="col s6" style="padding-top: 15px;">
        <h4>Strava Account</h4>
        @if ($member->strava_join == 0)
        <a class="concierge__button waves-effect blue waves-light btn btn-primary" href="{{ route('concierge.member.device.strava.oauth', $member->id) }}">Connect</a>
        @else
        <a class="concierge__button waves-effect blue waves-light btn btn-primary" href="{{ route('concierge.member.device.strava.revoke', $member->id) }}">Revoke Access</a>
        @endif
    </div> --}}
</div>
