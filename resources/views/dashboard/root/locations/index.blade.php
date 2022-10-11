@extends('layouts.dashboard')

@section('content')
<div class="content" id="rootLocationsList">
    <div class="row">
        <div class="input-field col s8">
            <input type="text" id="search" v-model="search">
            <label for="search">Search by Name/Address/Phone</label>
        </div>
        <div class="input-field col s4">
            <div class="switch right switch-near-inputs">
                <label>
                    Provisioned
                    <input type="checkbox" v-model="provisioned">
                    <span class="lever"></span>
                </label>
            </div>
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
                        <th></th>
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
                        <td>
                            <ul class="actionsList no-margin">
                                <li>
                                    <a :href="item.editLink" class="btn-small waves-effect waves-light green mainColorBackground">Edit</a>
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
window.Laravel.locations = {!! json_encode($locations) !!};
window.Laravel.pages     = {!! json_encode($pages) !!};
</script>
<script src="{{ asset('js/pages/root/locations.js') }}"></script>
@endpush
