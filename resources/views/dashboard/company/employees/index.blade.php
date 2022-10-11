@extends('layouts.dashboard')

@section('content')
<div class="content" id="employeesList">
    <div class="row">
        <div class="input-field col {{ auth()->user()->isAdmin() ? 's10' : 's12' }}">
            <input type="text" id="employeesSearch" v-model="search">
            <label for="employeesSearch">Search by Name or Phone or Email</label>
        </div>
        @if (auth()->user()->isAdmin())
        <div class="input-field col s2">
            <a class="waves-effect waves-light btn-small green right mainColorBackground" href="{{ $enterpriseEmployees ? route('enterprise.employees.create') : route('club.employees.create') }}"><i class="material-icons left">add</i>Add</a>
        </div>
        @endif
    </div>
    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th width="60"></th>
                        <th>Role</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone Number</th>
                        <th>Location</th>
                        <th width="80"></th>
                        <th width="80" v-if="isAdmin"></th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in list">
                        <td width="60">
                            <div :style="'background-image: url(\''+ item.photo +'\');'" class="avatar square-40x40 circle margin-0-auto"></div>
                        </td>
                        <td>@{{ item.roleName }}</td>
                        <td>@{{ item.displayName }}</td>
                        <td>@{{ item.email }}</td>
                        <td>@{{ item.phone }}</td>
                        <td>@{{ item.location }}</td>
                        <td width="80" class="center-align employeeRole">
                            <i v-if="item.isEmployee" class="material-icons grey-text text-darken-1">portrait</i>
                            <i v-else class="material-icons grey-text text-darken-1">account_box</i>
                        </td>
                        <td width="80" class="center-align" v-if="item.modifyAllowed">
                            <ul class="actionsList no-margin">
                                <li>
                                    <a :href="item.editLink" class="btn-floating btn-small waves-effect waves-light green mainColorBackground"><i class="material-icons">@{{ item.isMember?'dashboard':'edit' }}</i></a>
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
window.Laravel.enterpriseEmployees = {{ $enterpriseEmployees ? 1 : 0 }};
window.Laravel.employees           = {!! json_encode($employees) !!};
window.Laravel.pages               = {!! json_encode($pages) !!};
</script>
<script src="{{ asset('js/pages/employees.js') }}"></script>
@endpush
