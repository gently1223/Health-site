@extends('layouts.dashboard')

@section('content')
<div class="content" id="clientList">
    <div class="row">
        <div class="input-field col s12 }}">
            <input type="text" id="clientSearch" v-model="search">
            <label for="clientSearch">Search by Name / Client ID / Secret / Endpoint</label>
        </div>
    </div>
    @if (auth()->user()->isRoot())
    <div class="row">
        <div class="input-field col s12">
            <a class="waves-effect waves-light btn-small green right" href="{{ route('root.oclients.create') }}"><i class="material-icons left">add</i>Add</a>
        </div>
    </div>
    @endif

    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Client ID</th>
                        <th>Secret</th>
                        <th>Endpoint</th>
                        <th>Field</th>
                        <th>Logo</th>
                        <th width="80"></th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in list">
                        <td>@{{ item.name }}</td>
                        <td>@{{ item.client_id }}</td>
                        <td class="ellipsis max-w-300">@{{ item.secret }}</td>
                        <td class="ellipsis max-w-300">@{{ item.endpoint }}</td>
                        <td>@{{ item.field }}</td>
                        <td><img v-if="item.logo" :src="item.logo" height="30" width="80" class="img-contain"></td>
                        <td width="80" class="center-align" v-if="isRoot">
                            <ul class="actionsList no-margin">
                                <li>
                                    <a :href="'{{ route('root.oclients.edit', '') }}/'+item.id" class="btn-floating btn-small waves-effect waves-light green mainColorBackground"><i class="material-icons">edit</i></a>
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
window.Laravel.clients             = @json($clients);
window.Laravel.pages               = @json($pages);
window.Laravel.search_url          = "{{ route('root.oclients.search') }}";
</script>
<script src="{{ asset('js/pages/oclient.js') }}"></script>
@endpush
