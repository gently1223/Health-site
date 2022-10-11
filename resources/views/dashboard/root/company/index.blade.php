@extends('layouts.dashboard')

@section('content')
<div class="content" id="companyList">
    <div class="row">
        <div class="input-field col s12 }}">
            <input type="text" id="companySearch" v-model="search">
            <label for="companySearch">Search by Name, Type</label>
        </div>
    </div>
    @if (auth()->user()->isRoot())
    <div class="row">
        <div class="input-field col s12">
            <a class="waves-effect waves-light btn-small green right" href="{{ route('root.company.create') }}"><i class="material-icons left">add</i>Add</a>
        </div>
    </div>
    @endif

    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Compressed</th>
                        <th>Billable</th>
                        <th>CSV Delimited</th>
                        <th>Amenities Required</th>
                        <th>Multi Day Checkin</th>
                        <th width="80"></th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in list">
                        <td>@{{ item.id }}</td>
                        <td>@{{ item.name }}</td>
                        <td>@{{ item.type? item.type.name:'None' }}</td>
                        <td>@{{ item.compressed? 'YES':'NO' }}</td>
                        <td>@{{ item.billable? 'YES':'NO' }}</td>
                        <td>@{{ item.csv_delimiter }}</td>
                        <td>@{{ item.amenities_required? 'YES':'NO' }}</td>
                        <td>@{{ item.multi_day_checkin? 'YES':'NO' }}</td>
                        <td width="80" class="center-align" v-if="isRoot">
                            <ul class="actionsList no-margin">
                                <li>
                                    <a :href="'{{ route('root.company.edit', '') }}/'+item.id" class="btn-floating btn-small waves-effect waves-light green mainColorBackground"><i class="material-icons">edit</i></a>
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
window.Laravel.companies           = @json($companies);
window.Laravel.pages               = @json($pages);
window.Laravel.search_url          = "{{ route('root.company.search') }}";
</script>
<script src="{{ asset('js/pages/company.js') }}"></script>
@endpush
