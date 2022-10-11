@extends('layouts.dashboard')

@section('content')
<div class="content" id="provisioningList">
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
                        <th>Provisioning</th>
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
                            <i v-if="item.provisioned" class="material-icons green-text">verified_user</i>
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
window.Laravel.enterpriseLocations = true;
window.Laravel.locations           = {!! json_encode($locations) !!};
window.Laravel.pages               = {!! json_encode($pages) !!};
</script>
<script src="{{ asset('js/pages/provisioning.js') }}"></script>
@endpush
