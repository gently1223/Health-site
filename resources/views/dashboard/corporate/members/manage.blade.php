@extends('layouts.dashboard')

@section('content')
<div class="content" id="memberManage">
    <div class="row">
        <div class="col s12">
            <h5>Member: {{ isset($member) ? 'Edit' : 'Add' }}</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12 m8 offset-m2">
            <form method="POST" action="{{ route($isEnterprise ? 'enterprise.members.save' : 'club.members.save') }}">
                @csrf
                <input type="hidden" value="{{ isset($member) ? $member->id : 0 }}" name="memberId" />

                <div id="hasCropper">
                    @if (isset($member))
                    <input type="hidden" name="avatar" v-model="changeAvatar" />
                    <div class="col s12 m8 offset-m2">
                        {{-- <div class="avatar croppable-init" style="background-image: url('{{ isset($member) ? $member->photo : '' }}')"></div> --}}
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
                </div>

                <div class="row">
                    <div class="input-field col s12 {{ isset($member) ? 'm6' : '' }}">
                        <i class="material-icons prefix grey-text text-darken-1">email</i>
                        <input type="email" id="email" name="email" value="{{ old('email', isset($member) ? $member->email : null) }}" @if ($errors->has('email')) class="invalid" @endif>
                        <label for="email">Email address</label>
                        @if ($errors->has('email'))
                        <span class="helper-text" data-error="{{ $errors->first('email') }}"></span>
                        @endif
                    </div>
                    @if (isset($member))
                    <div class="input-field col s12 m6">
                        <div class="switch right switch-near-inputs">
                            <label>
                                Disabled
                                <input type="checkbox" name="status" {{ old('status', isset($member) && $member->status == 1 ? true : false) ? 'checked="checked"' : '' }}>
                                <span class="lever"></span>
                                Active
                            </label>
                        </div>
                    </div>
                    @endif
                </div>
                <div class="row">
                    <div class="input-field col s12 m4">
                        <i class="material-icons prefix grey-text text-darken-1">portrait</i>
                        <input type="text" id="first_name" name="first_name" value="{{ old('first_name', isset($member) ? $member->fname : null) }}" @if ($errors->has('first_name')) class="invalid" @endif>
                        <label for="first_name">First Name</label>
                        @if ($errors->has('first_name'))
                        <span class="helper-text" data-error="{{ $errors->first('first_name') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s12 m4">
                        <i class="material-icons prefix grey-text text-darken-1">portrait</i>
                        <input type="text" id="last_name" name="last_name" value="{{ old('last_name', isset($member) ? $member->lname : null) }}" @if ($errors->has('last_name')) class="invalid" @endif>
                        <label for="last_name">Last Name</label>
                        @if ($errors->has('last_name'))
                        <span class="helper-text" data-error="{{ $errors->first('last_name') }}"></span>
                        @endif
                    </div>
                    <div class="row">
                        <div class="input-field col s12 m4">
                            <i class="material-icons prefix grey-text text-darken-1">wc</i>
                            <select name="gender">
                                <option value="-1" @if (old('gender', isset($member) ? $member->gender : -1) == -1) selected @endif>No Gender</option>
                                <option value="1" @if (old('gender', isset($member) ? $member->gender : -1) == 1) selected @endif>Male</option>
                                <option value="0" @if (old('gender', isset($member) ? $member->gender : -1) == 0) selected @endif>Female</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12 m6">
                        <i class="material-icons prefix grey-text text-darken-1">lock</i>
                        <input type="password" id="password" name="password" value="{{ old('password', isset($member) && $member->password ? $member->password : null) }}" @if ($errors->has('password')) class="invalid" @endif>
                        <label for="password">Password</label>
                        @if ($errors->has('password'))
                        <span class="helper-text" data-error="{{ $errors->first('password') }}"></span>
                        @endif
                    </div>
                    <div class="input-field col s12 m6">
                        <i class="material-icons prefix grey-text text-darken-1">lock</i>
                        <input type="password" id="password_confirmation" name="password_confirmation" value="{{ old('password', isset($member) && $member->password ? $member->password : null) }}">
                        <label for="password_confirmation">Confirm Password</label>
                    </div>
                </div>

                <div id="managePrograms">
                    <div class="row">
                        <div class="input-field col s12">
                            <i class="material-icons prefix grey-text text-darken-1">list bulleted</i>
                            <select name="program_id" v-model="program_id">
                                <option value="0" @if (isset($member) && $member->program_id == 0) selected @endif>No Program</option>
                                @foreach ($programs as $program)
                                <option value="{{ $program->id }}" @if (isset($member) && $member->program_id == $program->id) selected @endif>{{ $program->name }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>

                    <div class="row" :class="{'hide': !codeRequired}">
                        <div class="input-field col s12">
                            <i class="material-icons prefix grey-text text-darken-1">code</i>
                            <input type="text" id="code" name="code" v-model="code" value="{{ old('code', isset($eligibleCode) ? $eligibleCode->code : null) }}" @if ($errors->has('code')) class="invalid" @endif>
                            <label for="code">Confirmation ID</label>
                            @if ($errors->has('code'))
                            <span class="helper-text" data-error="{{ $errors->first('code') }}"></span>
                            @endif
                        </div>
                        <div class="col s12" :class="{'hide': !codeVerifiable}">
                            <button type="button" class="margin-0 right waves-effect waves-light blue btn btn-primary mainColorBackground" @click="confirmCode">Verify</button>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="input-field col s12">
                        <i class="material-icons prefix grey-text text-darken-1">call</i>
                        <input type="text" id="phone" name="phone" value="{{ old('phone', isset($member) ? $member->phone : null) }}">
                        <label for="phone">Phone Number</label>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s6">
                        <i class="material-icons prefix grey-text text-darken-1">apartment</i>
                        <select name="company_id">
                            <option value="0" @if (isset($member) && $member->company_id == 0) selected @endif>Choose Company</option>
                           
                            @if(isset($companies))
                                @foreach ($companies as $company)
                                <option value="{{ $company->id }}" @if (isset($member) && $member->company_id == $company->id) selected @endif>{{ $company->name }}</option>
                                @endforeach
                            @endif

                        </select>
                    </div>
                    <div class="input-field col s6">
                        <i class="material-icons prefix grey-text text-darken-1">cake</i>
                        <input type="text" id="birthday" name="birthday" value="{{ old('birthday', isset($member) && $member->birthday ? $member->birthday->format('Y-m-d') : null) }}" @if ($errors->has('birthday')) class="invalid" @endif>
                        <label for="birthday">Birthday (YYYY-MM-DD)</label>
                        @if ($errors->has('birthday'))
                        <span class="helper-text" data-error="{{ $errors->first('birthday') }}"></span>
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
window.Laravel.code_required_programs = {!! json_encode($code_required_programs) !!};
window.Laravel.program_id             = '{{ isset($member) ? $member->program_id : 0 }}';
window.Laravel.eligibleCode           = '{{ isset($eligibleCode) ? $eligibleCode->code : '' }}';
window.Laravel.avatar                 = '{{ isset($member) ? $member->photo : '' }}';
</script>
<script src="{{ asset('js/pages/club/member-manage.js') }}"></script>
<script src="{{ asset('js/pages/cropper.js') }}"></script>
@endpush
