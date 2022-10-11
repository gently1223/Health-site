@extends('layouts.dashboard')

@section('content')
<div class="content">
    <div class="row">
        <div class="input-field col s12">
            <a class="waves-effect waves-light btn-small green right mainColorBackground" href="{{ route('enterprise.programs.add') }}"><i class="material-icons left">add</i>Program</a>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Sector</th>
                        <th>Tier</th>
                        <th>Hourly Rate ($)</th>
                        <th>Daily Rate ($)</th>
                        <th>Rate ($)</th>
                        <th>Allowance</th>
                        <th>Restriction</th>
                        <th>Status</th>
                        <th>Global</th>
                        <th width="150"></th>
                    </tr>
                </thead>

                <tbody>
                    @foreach ($programs as $program)
                    <tr>
                        <td>{{ $program->name }}</td>
                        <td>{{ $program->sector }}</td>
                        <td>{{ $program->tier }}</td>
                        <td>${{ $program->hourly_rate }}</td>
                        <td>${{ $program->daily_rate }}</td>
                        <td>${{ $program->rate }}</td>
                        <td>{{ $program->allowance }}</td>
                        <td>{{ $program->restriction }}</td>
                        <td>{{ $program->status ? 'ACTIVE' : 'INACTIVE' }}</td>
                        <td>{{ $program->global ? 'YES' : 'NO' }}</td>
                        <td>
                            <ul class="actionsList no-margin">
                                <li>
                                    <a href="{{ route('enterprise.programs.edit', $program->id) }}" class="btn-floating btn-small waves-effect waves-light green mainColorBackground"><i class="material-icons">edit</i></a>
                                    <a href="{{ route('enterprise.programs.disable', $program->id) }}" class="btn-floating btn-small waves-effect waves-light green mainColorBackground"><i class="material-icons">remove</i></a>
                                </li>
                            </ul>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
