@extends('layouts.dashboard')

@section('content')
<div class="content" id="rootAmenitiesResponses">
    <div class="row">
        <div class="col s6">
            <h5>{{ trim(($rootAmenitiesLocation->company->name ?? '').' '.$rootAmenitiesLocation->name.' - '.$rootAmenitiesLocation->address) }}</h5>
        </div>
        <div class="col s6">
            <a class="btn btn-primary right" style="margin: 15px 10px 0 0;" href="{{ route('enterprise.amenities.download', $rootAmenitiesLocation->id) }}">Download</a>
            <a class="right" style="margin: 22px 20px 0 0;" href="{{ route('enterprise.amenities') }}">Back to list</a>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th width="100">Question Type</th>
                        <th style="max-width: 30vw;">Question</th>
                        <th>Response</th>
                    </tr>
                </thead>

                <tbody>
                    @foreach ($rootAmenities as $item)
                    <tr>
                        <td width="100">{{ $item->type }}</td>
                        <td style="max-width: 30vw;">{{ $item->title }}</td>
                        @if ($item->type == 'boolean')
                        <td>{{ isset($rootAmenitiesResponses[$item->id]) ? ($rootAmenitiesResponses[$item->id] ? 'YES' : 'NO') : 'NOT SELECTED' }}</td>
                        @elseif ($item->type == 'checkbox')
                        <td>
                            @if (isset($rootAmenitiesResponses[$item->id]))
                                @php
                                    $checkboxResponses = [];

                                    foreach ($item->responses as $key => $response) {
                                        if (isset($rootAmenitiesResponses[$item->id][$key]) && $rootAmenitiesResponses[$item->id][$key]) {
                                            $checkboxResponses[] = $response;
                                        }
                                    }
                                @endphp

                                @if (count($checkboxResponses))
                                    {{ implode(', ', $checkboxResponses) }}
                                @else
                                    NOTHING CHECKED
                                @endif
                            @else
                                NOTHING CHECKED
                            @endif
                        </td>
                        @else
                        <td>{{ $rootAmenitiesResponses[$item->id] ?? 'NOT SET' }}</td>
                        @endif
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
