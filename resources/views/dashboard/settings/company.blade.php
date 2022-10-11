@extends('layouts.dashboard')

@section('content')
<div class="content" id="companySettingsPage">
    <div class="row">
        <div class="col s12 m8 offset-m2">
            <h5>Company Settings</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12 m8 offset-m2">
            @if ($errors->any())
            <div class="alert alert-danger">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
            @endif
            <form method="POST" action="{{ route('settings.company') }}">
                @csrf
                @if (auth()->user()->hasRole('root'))
                <div class="row">
                    <div class="input-field col s6">
                        <div class="switch">
                            <label>
                                Compressed
                                <input type="checkbox" id="compressed" name="compressed" {{ old('compressed', isset($company) && $company->compressed == 1 ? true : false) ? 'checked="checked"' : '' }}>
                                <span class="lever"></span>
                            </label>
                        </div>
                    </div>
                    <div class="input-field col s6">
                        <div class="switch">
                            <label>
                                Billable
                                <input type="checkbox" id="billable" name="billable" {{ old('billable', isset($company) && $company->billable == 1 ? true : false) ? 'checked="checked"' : '' }}>
                                <span class="lever"></span>
                            </label>
                        </div>
                    </div>
                </div>
                @endif

                <div class="row">
                    <div class="input-field col s6">
                        <div>CSV Reports delimiter type</div>
                        <select name="csv_delimiter">
                            <option value="comma" @if (isset($company) && $company->csv_delimiter == 'comma') selected @endif>COMMA</option>
                            <option value="tab" @if (isset($company) && $company->csv_delimiter == 'tab') selected @endif>TAB</option>
                        </select>
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
