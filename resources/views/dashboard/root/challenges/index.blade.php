@extends('layouts.dashboard')

@section('content')
<div class="content" id="challengeList">
    <div class="row">
        <div class="input-field col s12 }}">
            <input type="text" id="challengeSearch" v-model="search">
            <label for="challengeSearch">Search by Title / Sub Title</label>
        </div>
    </div>
    @if (auth()->user()->isRoot())
    <div class="row">
        <div class="input-field col s12">
            <a class="waves-effect waves-light btn-small green right" href="{{ route('root.challenges.create') }}"><i class="material-icons left">add</i>Add</a>
        </div>
    </div>
    @endif

    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Photo</th>
                        <th>Title</th>
                        <th>Sub Title</th>
                        <th>Type</th>
                        <th>Distance</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Description</th>
                        <th>Medal</th>
                        <th>Price</th>
                        <th>Active</th>
                        <th width="80"></th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in list">
                        <td>@{{ item.id }}</td>
                        <td><img v-if="item.photo" :src="item.photo" width="100" class="img-contain"></td>
                        <td>@{{ item.title }}</td>
                        <td>@{{ item.subtitle }}</td>
                        <td>@{{ item.type?item.type.name:'' }}</td>
                        <td>@{{ item.distance }}</td>
                        <td>@{{ item.start_date }}</td>
                        <td>@{{ item.end_date }}</td>
                        <td style="max-width:350px">@{{ item.desc }}</td>
                        <td><img v-if="item.medal_url" :src="item.medal_url" width="100" class="img-contain"></td>
                        <td>@{{ item.price }}</td>
                        <td>@{{ item.active? 'YES':'NO' }}</td>
                        <td width="80" class="center-align" v-if="isRoot">
                            <ul class="actionsList no-margin">
                                <li>
                                    <a :href="'{{ route('root.challenges.edit', '') }}/'+item.id" class="btn-floating btn-small waves-effect waves-light green mainColorBackground"><i class="material-icons">edit</i></a>
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
window.Laravel.challenges           = {!! json_encode($challenges) !!};
window.Laravel.pages               = {!! json_encode($pages) !!};
window.Laravel.search_url          = "{{ route('root.challenges.search') }}";
</script>
<script src="{{ asset('js/pages/challenge.js') }}"></script>
@endpush
