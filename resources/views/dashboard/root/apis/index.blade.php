@extends('layouts.dashboard')

@section('content')
<div class="content" id="apiList">
    <div class="row">
        <div class="input-field col s12 }}">
            <input type="text" id="apiSearch" v-model="search">
            <label for="apiSearch">Search by Name / API Key</label>
        </div>
    </div>
    @if (auth()->user()->isRoot())
    <div class="row">
        <div class="input-field col s12">
            <a class="waves-effect waves-light btn-small green right" href="{{ route('root.apis.create') }}"><i class="material-icons left">add</i>Add</a>
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
                        <th>API Key</th>
                        <th>Company</th>
                        <th>Image</th>
                        <th width="80"></th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in list">
                        <td>@{{ item.id }}</td>
                        <td>@{{ item.name }}</td>
                        <td>@{{ item.apikey }}</td>
                        <td>@{{ item.company?item.company.name:'' }}</td>
                        <td><img v-if="item.image" :src="item.image" height="30" class="img-contain"></td>
                        <td width="80" class="center-align" v-if="isRoot">
                            <ul class="actionsList no-margin">
                                <li>
                                    <a :href="'{{ route('root.apis.edit', '') }}/'+item.id" class="btn-floating btn-small waves-effect waves-light green mainColorBackground"><i class="material-icons">edit</i></a>
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
window.Laravel.apis                = @json($apis);
window.Laravel.pages               = @json($pages);
window.Laravel.search_url          = "{{ route('root.apis.search') }}";
</script>
<script src="{{ asset('js/pages/api.js') }}"></script>
@endpush
