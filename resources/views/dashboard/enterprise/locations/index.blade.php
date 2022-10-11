@extends('layouts.dashboard')

@section('content')
<div class="content" id="locationsList">
    <div class="row">
        <div class="input-field col s12">
            <input type="text" id="search" v-model="search">
            <label for="search">Search by Name/Address/Phone</label>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Address</th>
                        <th>City</th>
                        <th>State</th>
                        <th>Phone</th>
                        <th>Parent</th>
                        <th v-if="isEnterprise"></th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in list">
                        <td>@{{ item.id }}</td>
                        <td>@{{ item.name }}</td>
                        <td>@{{ item.address }}</td>
                        <td>@{{ item.city }}</td>
                        <td>@{{ item.state }}</td>
                        <td>@{{ item.phone }}</td>
                         <td >@{{ item.parent_id }}</td>
                        <td v-if="isEnterprise">
                            <ul class="actionsList no-margin" v-if="item.currentLocation == false">
                                <li>
                                    <a :href="item.switchLink" class="btn-small waves-effect waves-light green mainColorBackground">Switch</a>
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
window.Laravel.enterpriseLocations = true;
window.Laravel.locations           = {!! json_encode($locations) !!};
window.Laravel.pages               = {!! json_encode($pages) !!};
</script>
<script src="{{ asset('js/pages/locations.js') }}"></script>
@endpush
