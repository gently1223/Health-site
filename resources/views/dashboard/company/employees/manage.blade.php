@extends('layouts.dashboard')

@section('content')
<div class="content" id="employeeProfile">
    <div class="row">
        <div class="col s12">
            <h5>Employee: {{ isset($employee) ? 'Edit' : 'Add' }}</h5>
        </div>
    </div>
    <div class="row" id="hasCropper">
        @if (isset($employee))
        <div class="col s12 m8 offset-m2">
            <div class="avatar croppable-init" :style="{'background-image': 'url(' + avatar +')'}" @click="openAvatarModal"></div>
            @if ($errors->has('avatar'))
            <span class="red-text">{{ $errors->first('avatar') }}</span>
            @endif

            <div class="modal" ref="cropperModal">
                <div class="modal-content">
                    <h5 class="center-align">Upload Image</h5>
                    <div class="row margin-0" v-if="!cropperVisible">
                        <div class="col s12">
                            <button type="button" class="margin-0 left waves-effect waves-dark blue btn btn-primary mainColorBackground uploadable">
                                Upload
                                <input type="file" @change="showCropper" accept="image/x-png,image/jpeg" />
                            </button>
                        </div>
                    </div>
                    <div class="row" v-if="cropperVisible">
                        <div class="col s12">
                            <cropper class="cropper" :src="img" :stencil-props="options" stencil-component="circle-stencil" @change="cropImage"></cropper>
                            <span class="red-text" v-if="cropperError">@{{ cropperError }}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer modal-footer-styled">
                    <div class="padding-0-20-20 overflow-hidden">
                        <button type="button" class="margin-0 left waves-effect waves-dark btn-flat" @click="cancelCropper">Cancel</button>
                        <button type="button" class="margin-0 right waves-effect waves-light blue btn btn-primary mainColorBackground" @click="saveCropper">Confirm</button>
                    </div>
                </div>
            </div>
        </div>
        @endif
        <div class="col s12 m8 offset-m2">
            <form method="POST" action="{{ $enterpriseEmployees ? route('enterprise.employees.save') : route('club.employees.save') }}">
                @csrf
                <input type="hidden" value="{{ isset($employee) ? $employee->id : 0 }}" name="employeeId" />
                <input type="hidden" name="avatar" v-model="changeAvatar" />
                <div class="row">
                    <div class="input-field col s12 m6">
                        <i class="material-icons prefix grey-text text-darken-1">email</i>
                        <input type="email" id="email" name="email" value="{{ old('email', isset($employee) ? $employee->email : null) }}" @if ($errors->has('email')) class="invalid" @endif>
                        <label for="email">Email address</label>
                        @if ($errors->has('email'))
                        <span class="helper-text" data-error="{{ $errors->first('email') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s12 {{ isset($employee) ? 'm3' : 'm6' }}">
                        <select name="role">
                            @foreach ($allowedRoles as $roleSlug => $roleName)
                            <option value="{{ $roleSlug }}" @if (isset($employee) && $employee->role->slug == $roleSlug) selected @endif>{{ $roleName }}</option>
                            @endforeach
                        </select>
                        @if ($errors->has('role'))
                        <span class="helper-text" data-error="{{ $errors->first('role') }}"></span>
                        @endif
                    </div>
                    @if (isset($employee))
                    <div class="input-field col s12 m3">
                        <div class="switch right switch-near-inputs">
                            <label>
                                Disabled
                                <input type="checkbox" name="status" {{ old('status', isset($employee) && $employee->status == 1 ? true : false) ? 'checked="checked"' : '' }}>
                                <span class="lever"></span>
                                Active
                            </label>
                        </div>
                    </div>
                    @endif
                </div>
                @if ($enterpriseEmployees)
                <div class="row">
                    <div class="input-field col s12">
                        <select name="location_id">
                            @foreach ($locations as $location)
                            <option value="{{ $location->id }}" @if (isset($employee) && $employee->location_id == $location->id) selected @endif>{{ $location->name }} - {{ $location->address }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
                @endif
                <div class="row">
                    <div class="input-field col s12 m6">
                        <i class="material-icons prefix grey-text text-darken-1">portrait</i>
                        <input type="text" id="first_name" name="first_name" value="{{ old('first_name', isset($employee) ? $employee->fname : null) }}" @if ($errors->has('first_name')) class="invalid" @endif>
                        <label for="first_name">First Name</label>
                        @if ($errors->has('first_name'))
                        <span class="helper-text" data-error="{{ $errors->first('first_name') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s12 m6">
                        <i class="material-icons prefix grey-text text-darken-1">portrait</i>
                        <input type="text" id="last_name" name="last_name" value="{{ old('last_name', isset($employee) ? $employee->lname : null) }}" @if ($errors->has('last_name')) class="invalid" @endif>
                        <label for="last_name">Last Name</label>
                        @if ($errors->has('last_name'))
                        <span class="helper-text" data-error="{{ $errors->first('last_name') }}"></span>
                        @endif
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12">
                        <i class="material-icons prefix grey-text text-darken-1">call</i>
                        <input type="text" id="phone" name="phone" value="{{ old('phone', isset($employee) ? $employee->phone : null) }}">
                        <label for="phone">Phone Number</label>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12 m6">
                        <i class="material-icons prefix grey-text text-darken-1">security</i>
                        <input type="password" id="password" name="password" @if ($errors->has('password')) class="invalid" @endif>
                        <label for="password">Password</label>
                        @if ($errors->has('password'))
                        <span class="helper-text" data-error="{{ $errors->first('password') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s12 m6">
                        <i class="material-icons prefix grey-text text-darken-1">security</i>
                        <input type="password" id="password_confirmation" name="password_confirmation">
                        <label for="password_confirmation">Confirm Password</label>
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
window.Laravel.avatar = '{{ isset($employee) ? $employee->photo : null }}';
</script>
<script src="{{ asset('js/pages/cropper.js') }}"></script>
@endpush
