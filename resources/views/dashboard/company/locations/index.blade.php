@extends('layouts.dashboard')

@section('content')
<div class="content" id="locationsList">
    <div class="row">
        <div class="input-field col s12">
            <input type="text" id="search" v-model="search">
            <label for="search">Search by Name/Address/Phone</label>
        </div>
    </div>
    @if (!$enterpriseLocation)
    <div class="row">
        <div class="col s12">
            <a class="waves-effect waves-light btn-small green right" href="{{ route('club.locations.create') }}"><i class="material-icons left">add</i>Add</a>
        </div>
    </div>
    @endif
    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th>Location ID</th>
                        <th>Club ID</th>
                        <th>Primary Location</th>
                        <th>Address</th>
                        <th>City</th>
                        <th>State</th>
                        <th>Phone</th>
                        <th></th>
                        <th v-if="isAdmin"></th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in list">
                        <td>@{{ item.id }}</td>
                        <td>@{{ item.club_id }}</td>
                        <td>@{{ item.name }}</td>
                        <td>@{{ item.address }}</td>
                        <td>@{{ item.city }}</td>
                        <td>@{{ item.state }}</td>
                        <td>@{{ item.phone }}</td>
                        <td v-if="item.parent_id == -1">
                         ✓
                        </td>
                        <td v-if="item.parent_id > -1">

                        </td>

                        <td v-if="item.modifyAllowed">
                            <ul class="actionsList no-margin">
                                <li>
                                    <a :href="item.editLink" class="btn-floating btn-small waves-effect waves-light green mainColorBackground"><i class="material-icons">edit</i></a>
                                    <a v-if="!item.currentLocation && isClubPage" :href="item.switchClubLink" class="btn-floating btn-small waves-effect waves-light green mainColorBackground"><i class="material-icons">login</i></a>
                                    <a v-else-if="!item.currentLocation" :href="item.switchLink" class="btn-floating btn-small waves-effect waves-light green mainColorBackground"><i class="material-icons">login</i></a>
                                </li>
                            </ul>
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
window.Laravel.enterpriseLocations = {{ $enterpriseLocation ? 1 : 0 }};
window.Laravel.locations           = {!! json_encode($locations) !!};
window.Laravel.pages               = {!! json_encode($pages) !!};
</script>
<script src="{{ asset('js/pages/locations.js') }}"></script>
@endpush
