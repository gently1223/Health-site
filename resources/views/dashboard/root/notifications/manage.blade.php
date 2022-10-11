@extends('layouts.dashboard')

@section('content')
<div class="content">
    <div class="row">
        <div class="col s12">
            <h5>Notification: {{ isset($notification) ? 'Edit' : 'Add' }}</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <form method="post" action="{{ route('root.notifications.save') }}">
                @csrf
                @if (isset($notification))
                <input type="hidden" name="notification_id" value="{{ $notification->id }}" />
                @endif

                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" name="title" id="title" value="{{ old('title', isset($notification) ? $notification->title : null) }}" @if ($errors->has('title')) class="invalid" @endif>
                        <label for="title">Title</label>
                        @if ($errors->has('title'))
                        <span class="helper-text" data-error="{{ $errors->first('title') }}"></span>
                        @endif
                    </div>
                </div>

                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" name="message" id="message" value="{{ old('message', isset($notification) ? $notification->message : null) }}" @if ($errors->has('message')) class="invalid" @endif>
                        <label for="message">Message</label>
                        @if ($errors->has('message'))
                        <span class="helper-text" data-error="{{ $errors->first('message') }}"></span>
                        @endif
                    </div>
                </div>

                <div class="row">
                    <div class="input-field col s6">
                        <input type="text" name="start_date" id="start_date" value="{{ old('start_date', isset($notification) ? $notification->start_date->format('Y-m-d') : null) }}" @if ($errors->has('start_date')) class="invalid" @endif>
                        <label for="start_date">Start Date (YYYY-MM-DD)</label>
                        @if ($errors->has('start_date'))
                        <span class="helper-text" data-error="{{ $errors->first('start_date') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s6">
                        <input type="text" name="end_date" id="end_date" value="{{ old('end_date', isset($notification) ? $notification->end_date->format('Y-m-d') : null) }}" @if ($errors->has('end_date')) class="invalid" @endif>
                        <label for="end_date">End Date (YYYY-MM-DD)</label>
                        @if ($errors->has('end_date'))
                        <span class="helper-text" data-error="{{ $errors->first('end_date') }}"></span>
                        @endif
                    </div>
                </div>

                <div class="row">
                    <div class="col s12 center-align">
                        <button class="waves-effect waves-light btn green mainColorBackground" type="submit">Save</button>
                    </div>
                </div>

            </form>
        </div>
    </div>
</div>
@endsection
