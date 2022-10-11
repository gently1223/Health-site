@extends('layouts.dashboard')

@section('content')
<div class="content" id="rootGlobalNotifications">
    <div class="row">
        <div class="input-field col s12">
            <h5 class="left">Global Notifications</h5>
            <a href="{{ route('root.notifications.create') }}" class="btn right green mainColorBackground">Add Notification</a>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Title</th>
                        <th>Message</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    @foreach ($list as $item)
                    <tr>
                        <td>{{ $item->id }}</td>
                        <td>{{ $item->start_date->format('Y-m-d') }}</td>
                        <td>{{ $item->end_date->format('Y-m-d') }}</td>
                        <td>{{ $item->title }}</td>
                        <td>{{ $item->message }}</td>
                        <td>
                            <ul class="actionsList no-margin">
                                <li>
                                    <a href="{{ route('root.notifications.edit', $item->id) }}" class="btn-small waves-effect waves-light green mainColorBackground">Edit</a>
                                    <a href="{{ route('root.notifications.remove', $item->id) }}" class="btn-small waves-effect waves-light red">Remove</a>
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
