@extends('layouts.dashboard')

@section('content')
<div class="content" id="clubCheckinsList">
    <div class="row">
        <div class="input-field col s12">
            <input type="text" id="search" v-model="search">
            <label for="search">Search by Member ID/Name/Location/Program</label>
        </div>
    </div>

    <div class="row">
        <div class="col s12">
            <table class="striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Member ID</th>
                        <th>Birthday</th>
                        <th>Last Name</th>
                        <th>First Name</th>
                        <th>Date</th>
                        <th>Gym PK</th>
                        <th>Name</th>
                        <th>Address</th>
                        <th>City</th>
                        <th>State</th>
                        <th>Postal</th>
                        <th>Program</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in list"  @click="redirectToViewPage(item.id)">
                        <td>@{{ item.id_formatted }}</td>
                        <td>@{{ item.memberid }}</td>
                        <td>@{{ item.birthday }}</td>
                        <td>@{{ item.lname }}</td>
                        <td>@{{ item.fname }}</td>
                        <td>@{{ item.timestamp }}</td>
                        <td>@{{ item.gym_pk }}</td>
                        <td>@{{ item.name }}</td>
                        <td>@{{ item.address }}</td>
                        <td>@{{ item.city }}</td>
                        <td>@{{ item.state }}</td>
                        <td>@{{ item.postal }}</td>
                        <td>@{{ item.program }}</td>
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
window.Laravel.checkins = {!! json_encode($list) !!};
window.Laravel.pages    = {!! json_encode($pages) !!};
</script>
<script src="{{ asset('js/pages/clubCheckins.js') }}"></script>
@endpush
