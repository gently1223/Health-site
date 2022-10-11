@extends('layouts.dashboard')

@section('content')
<div class="content">
    <div class="row">
        <div class="input-field col s12">
            <h5>Add Program</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <form method="POST" action="{{ route('club.programs.connect') }}">
                @csrf
                <table class="striped low-padding">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th width="250"></th>
                        </tr>
                    </thead>

                    <tbody>
                        @foreach ($programs as $program)
                        <tr>
                            <td>{{ $program->name }}</td>
                            <td>
                                <ul class="actionsList no-margin">
                                    <li>
                                        <button type="submit" name="program_id" value="{{ $program->id }}" class="btn-small waves-effect waves-light green mainColorBackground">Add</button>
                                    </li>
                                </ul>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </form>
        </div>
    </div>
</div>
@endsection
