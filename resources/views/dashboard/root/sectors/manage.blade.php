@extends('layouts.dashboard')

@section('content')
<div class="content" id="sectorProfile">
    <div class="row">
        <div class="col s12">
            <h5>Company Program Sector: {{ isset($sector) ? 'Edit' : 'Add' }}</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12 m8 offset-m2">
            <form method="POST" action="{{ route('root.sectors.save') }}">
                @csrf
                <input type="hidden" value="{{ isset($sector) ? $sector->id : 0 }}" name="id" />

                <div class="row">
                    <div class="input-field col s12">
                        <input type="text" id="name" name="name" value="{{ old('name', isset($sector) ? $sector->name : null) }}" @if ($errors->has('name')) class="invalid" @endif>
                        <label for="name">Name</label>
                        @if ($errors->has('name'))
                        <span class="helper-text" data-error="{{ $errors->first('name') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s6">
                        <input type="number" id="status" name="status" value="{{ old('status', isset($sector) ? $sector->status : null) }}" @if ($errors->has('status')) class="invalid" @endif>
                        <label for="status">Status</label>
                        @if ($errors->has('status'))
                        <span class="helper-text" data-error="{{ $errors->first('status') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row"></div>
                <div class="row"></div>
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
