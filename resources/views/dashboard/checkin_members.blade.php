@extends('layouts.dashboard')

@section('content')
<div class="content" id="membersList">
    <div class="row">
        <div class="input-field col s12">
            <input type="text" id="search" v-model="search">
            <label for="search">Search by Name</label>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <table class="striped low-padding" id="members">
                <thead>
                    <tr>
                        <th width="60"></th>
                        <th>Name</th>
                        <th>Latest Checkin</th>
                        <th>Program</th>
                        <th width="80"></th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in list" @click="redirectToViewPage(item.id)">
                        <td width="60">
                            <div :style="'background-image: url(\''+ item.photo +'\');'" class="avatar square-40x40 circle margin-0-auto"></div>
                        </td>
                        <td>@{{ item.displayName }}</td>
                        <td>@{{ localTime(item.latestCheckin) }}</td>
                        <td>@{{ item.program }}</td>
                        <td width="80" class="center-align memberRole">
                            <i v-if="item.isEligible" class="material-icons green-text">verified_user</i>
                            <i v-else class="material-icons-outlined grey-text text-darken-1">verified_user</i>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <div class="row" v-if="pages > 1">
        <div class="col s12">
            <paginate
                v-model="page"
                :page-count="pages"
                :click-handler="setPage"
                :prev-text="'<i class=\'material-icons\'>chevron_left</i>'"
                :next-text="'<i class=\'material-icons\'>chevron_right</i>'"
                :container-class="'pagination'">
            </paginate>
        </div>
    </div>
</div>
@endsection

@push('js')
<script>
window.Laravel.members      = {!! json_encode($members) !!};
window.Laravel.pages        = {!! json_encode($pages) !!};
window.Laravel.ledgerId     = {!! $ledgerId !!};
</script>
<script src="{{ asset('js/pages/members.js') }}"></script>
@endpush
