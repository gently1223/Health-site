@extends('layouts.dashboard')

@section('content')
<div id="rootAmenities">
    <div class="row">
        <div class="input-field col s12">
            <h5 class="left">Amenities</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th width="400">Title</th>
                        <th width="400">Description</th>
                        <th>Responses</th>
                        <th>Required</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    @foreach ($list as $item)
                    <tr>
                        <td>{{ $item->id }}</td>
                        <td>{{ $item->type }}</td>
                        <td>{{ $item->title }}</td>
                        <td>{!! $item->description !!}</td>
                        <td>{{ implode(', ', $item->responses) }}</td>
                        <td>{{ $item->required ? 'YES' : 'NO' }}</td>
                        <td>
                            <ul class="actionsList no-margin">
                                <li>
                                    <a href="{{ route('root.amenities.edit', $item->id) }}" class="btn-small waves-effect waves-light green mainColorBackground">Edit</a>
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

@push('js')
@endpush
