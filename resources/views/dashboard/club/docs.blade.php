@extends('layouts.dashboard')

@section('content')
<div class="content">
    <div class="row">
        <div class="col s12">
            <h5>Club Documents</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <ul class="collapsible clubDocsList">
                @foreach ($directories as $directory)
                <li>
                    <div class="collapsible-header"><i class="material-icons">folder_open</i>{{ $directory->name }}<i class="material-icons collapsible-arrow-right">keyboard_arrow_down</i></div>
                    <div class="collapsible-body">
                        <ul>
                            @foreach ($directory->documents as $document)
                            <li>
                                <a href="{{ $document->path }}" target="_blank"><i class="material-icons">save_alt</i>{{ $document->document }}</a>
                            </li>
                            @endforeach
                        </ul>
                    </div>
                </li>
                @endforeach
            </ul>
        </div>
    </div>
</div>
@endsection
