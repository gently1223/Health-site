@extends('layouts.dashboard')

@section('content')
<div class="content" id="rootAmenitiesResponses">
    <div class="row">
        <div class="input-field col s8">
            <input type="text" id="search" v-model="search">
            <label for="search">Search by Company Name/Location Name/Location Address</label>
        </div>
        <div class="col s4">
            <a class="btn btn-primary right" style="margin: 15px 10px 0 0;" href="{{ route('enterprise.amenities.download.all') }}">Download All</a>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th>Company ID</th>
                        <th>Company Name</th>
                        <th>Location ID</th>
                        <th>Location</th>
                        <th>Address</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in list">
                        <td>@{{ item.companyId }}</td>
                        <td>@{{ item.companyName }}</td>
                        <td>@{{ item.id }}</td>
                        <td>@{{ item.name }}</td>
                        <td>@{{ item.address }}</td>
                        <td>
                            <ul class="actionsList no-margin">
                                <li>
                                    <a :href="item.viewLink" class="btn-small waves-effect waves-light green mainColorBackground">View</a>
                                    <a :href="item.downloadLink" class="btn-small waves-effect waves-light green mainColorBackground">Download</a>
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
window.Laravel.amenitiesLocations = {!! json_encode($amenitiesLocations) !!};
window.Laravel.pages              = {!! json_encode($pages) !!};
</script>
<script src="{{ asset('js/pages/enterprise/amenities.js') }}"></script>
@endpush
