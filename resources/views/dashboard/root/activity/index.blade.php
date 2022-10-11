@extends('layouts.dashboard')

@section('content')
<div class="content" id="activityList">
    <div class="row">
        <div class="input-field col s12 }}">
            <input type="text" id="activitySearch" v-model="search">
            <label for="activitySearch">Search by Name</label>
        </div>
    </div>
    @if (auth()->user()->isRoot())
    <div class="row">
        <div class="input-field col s12">
            <a class="waves-effect waves-light btn-small green right" href="{{ route('root.activity.create') }}"><i class="material-icons left">add</i>Add</a>
        </div>
    </div>
    @endif

    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Time</th>
                        <th>Client</th>
                        <th>User</th>
                        <th>Location</th>
                        <th>Lat</th>
                        <th>Lng</th>
                        <th>Score</th>
                        <th>Calories</th>
                        <th>Minutes</th>
                        <th>Steps</th>
                        <th>Distance</th>
                        <th>Hart</th>
                        <th>Duration</th>
                        <th>Watts</th>
                        <th>Water</th>
                        <th>Weight</th>
                        <th>Active</th>
                        <th width="80"></th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in list">
                        <td>@{{ item.name }}</td>
                        <td>@{{ item.timestamp }}</td>
                        <td>@{{ item.client?item.client.name:'' }}</td>
                        <td>@{{ item.user?item.user.fname+' '+item.user.lname:'' }}</td>
                        <td>@{{ item.location?item.location.name:'' }}</td>
                        <td>@{{ item.lat }}</td>
                        <td>@{{ item.lng }}</td>
                        <td>@{{ item.score }}</td>
                        <td>@{{ item.calories }}</td>
                        <td>@{{ item.minutes }}</td>
                        <td>@{{ item.steps }}</td>
                        <td>@{{ item.distance }}</td>
                        <td>@{{ item.hart }}</td>
                        <td>@{{ item.duration }}</td>
                        <td>@{{ item.watts }}</td>
                        <td>@{{ item.water }}</td>
                        <td>@{{ item.weight }}</td>
                        <td>@{{ item.active? 'YES':'NO' }}</td>
                        <td width="80" class="center-align" v-if="isRoot">
                            <ul class="actionsList no-margin">
                                <li>
                                    <a :href="'{{ route('root.activity.edit', '') }}/'+item.id" class="btn-floating btn-small waves-effect waves-light green mainColorBackground"><i class="material-icons">edit</i></a>
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
window.Laravel.activities           = {!! json_encode($activities) !!};
window.Laravel.pages               = {!! json_encode($pages) !!};
window.Laravel.search_url          = "{{ route('root.activity.search') }}";
</script>
<script src="{{ asset('js/pages/activity.js') }}"></script>
@endpush
