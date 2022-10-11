@extends('layouts.dashboard')

@section('content')
<div class="content">
    <div class="row">
        <div class="col s12">
            <h5>Remove Notification: {{ $notification->title }}</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <form method="post" action="{{ route('root.notifications.delete', $notification->id) }}">
                @csrf

                <p class="card-panel">Are you sure you want to remove <b>{{ $notification->title }}</b> notification?</p>

                <div class="row">
                    <div class="col s12 center-align">
                        <button class="waves-effect waves-light btn red right" type="submit">Confirm</button>
                        <a href="{{ route('root.notifications') }}" class="waves-effect waves-light btn green right" style="margin-right: 20px;">Cancel</a>
                    </div>
                </div>

            </form>
        </div>
    </div>
</div>
@endsection
