@extends('layouts.dashboard')

@section('content')
<div class="content" id="clientList">
    <div class="row">
        <div class="col s12">
            <h5>Company: {{ isset($client) ? 'Edit' : 'Add' }}</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <form method="POST" action="{{ route('root.oclients.save') }}">
                @csrf
                <input type="hidden" value="{{ isset($client) ? $client->id : 0 }}" name="id" />

                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" id="name" name="name" value="{{ old('name', isset($client) ? $client->name : null) }}" @if ($errors->has('name')) class="invalid" @endif>
                        <label for="name">Name</label>
                        @if ($errors->has('name'))
                        <span class="helper-text" data-error="{{ $errors->first('name') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s6">
                        <input type="text" id="client_id" name="client_id" value="{{ old('client_id', isset($client) ? $client->client_id : null) }}" @if ($errors->has('client_id')) class="invalid" @endif>
                        <label for="client_id">Client ID</label>
                        @if ($errors->has('client_id'))
                        <span class="helper-text" data-error="{{ $errors->first('client_id') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s6">
                        <input type="text" id="secret" name="secret" value="{{ old('secret', isset($client) ? $client->secret : null) }}" @if ($errors->has('secret')) class="invalid" @endif>
                        <label for="secret">Secret</label>
                        @if ($errors->has('secret'))
                        <span class="helper-text" data-error="{{ $errors->first('secret') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s6">
                        <input type="text" id="endpoint" name="endpoint" value="{{ old('endpoint', isset($client) ? $client->endpoint : null) }}" @if ($errors->has('endpoint')) class="invalid" @endif>
                        <label for="endpoint">Endpoint</label>
                        @if ($errors->has('endpoint'))
                        <span class="helper-text" data-error="{{ $errors->first('endpoint') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s6">
                        <input type="text" id="logo" name="logo" value="{{ old('logo', isset($client) ? $client->logo : null) }}" @if ($errors->has('logo')) class="invalid" @endif>
                        <label for="logo">Logo</label>
                        @if ($errors->has('logo'))
                        <span class="helper-text" data-error="{{ $errors->first('logo') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s6">
                        <select name="company_id" id="company_id" @if ($errors->has('company_id')) class="invalid" @endif>
                            <option value="">Choose Company</option>
                            @foreach ($companies as $company)
                            <option value="{{ $company->id }}" @if (isset($client) && $client->company_id == $company->id) selected @endif>{{ $company->name }}</option>
                            @endforeach
                        </select>
                        <label for="company">Company</label>
                        @if ($errors->has('company_id'))
                        <span class="helper-text" data-error="{{ $errors->first('company_id') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s6">
                        <select name="program_id" id="program_id" @if ($errors->has('program_id')) class="invalid" @endif>
                            @if (count($programs) > 0)
                            <option value="">Choose Program</option>
                            @foreach ($programs as $p)
                            <option value="{{ $p->program->id }}" @if (isset($client) && $client->program_id == $p->program->id) selected @endif>{{ $p->program->name }}</option>
                            @endforeach
                            @endif
                        </select>
                        <label for="program">Program</label>
                        @if ($errors->has('program_id'))
                        <span class="helper-text" data-error="{{ $errors->first('program_id') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" id="field" name="field" value="{{ old('field', isset($client) ? $client->field : null) }}" @if ($errors->has('field')) class="invalid" @endif>
                        <label for="field">Field</label>
                        @if ($errors->has('field'))
                        <span class="helper-text" data-error="{{ $errors->first('field') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="col s12 center-align">
                        <button class="waves-effect waves-light btn green mainColorBackground">Save</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@push('js')
<script>
window.Laravel.companies             = @json($companies);
</script>
<script src="{{ asset('js/pages/oclient.js') }}"></script>
@endpush
