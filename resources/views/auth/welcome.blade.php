@extends('layouts.auth')

@push('css')
<link href="{{ asset('css/registration.css') }}" rel="stylesheet">
<link href="{{ asset('widgets/mstepper/mstepper.min.css') }}" rel="stylesheet" />
@endpush

@section('content')
<div class="authPageLeft"></div>
<div class="authPageRight">
    <div class="full-height" id="registrationPage">
        <div class="pageLoading" v-if="isLoad">
            <div class="preloader-wrapper big active">
                <div class="spinner-layer spinner-blue-only">
                    <div class="circle-clipper left">
                        <div class="circle"></div>
                    </div><div class="gap-patch">
                        <div class="circle"></div>
                    </div><div class="circle-clipper right">
                        <div class="circle"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="auth-panel">
            <div class="card-header">
                <div class="row">
                    <div class="col s12">
                        <h4 class="center-align margin-0">Welcome.</h4>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <form method="POST" action="{{ route('welcome.register') }}" ref="registerForm">
                    @csrf

                    <ul class="stepper linear">
                        <li class="step active"> <!-- Step 0 -->
                            <template>
                                <div class="step-title">Choose Company</div>
                                <div class="step-content">
                                    <input type="hidden" name="company_id" id="company_id" v-model="company_id">
                                    <div class="input-field">
                                        <input type="text" name="search_company" id="search_company" v-model="search_company">
                                        <label for="search_company">Search for company</label>
                                    </div>

                                    <ul class="collection" v-if="companies.length > 0">
                                        <li class="collection-item" v-for="company in companies" @click="selectCompany(company.id, company.domain)" :class="{'active': company.id == company_id}">@{{ company.name }}</li>
                                    </ul>
                                </div>
                            </template>
                        </li>
                        <li class="step"> <!-- Step 1 -->
                            <div class="step-title">Employee Information</div>
                            <div class="step-content">
                                <div class="input-field">
                                    <input type="email" name="user_email" id="user_email" v-model="user_email" :class="{invalid: invalid_domain}">
                                    <label for="user_email">Company Email</label>
                                    <span class="helper-text" data-error="Please use your work email" v-if="invalid_domain"></span>
                                </div>
                                <div class="input-field">
                                    <input type="text" name="user_first_name" id="user_first_name" v-model="user_first_name">
                                    <label for="user_first_name">First Name</label>
                                </div>
                                <div class="input-field">
                                    <input type="text" name="user_last_name" id="user_last_name" v-model="user_last_name">
                                    <label for="user_last_name">Last Name</label>
                                </div>
                                <div class="input-field">
                                    <input type="text" name="user_phone" id="user_phone" v-model="user_phone">
                                    <label for="user_phone">Phone</label>
                                </div>
                                <div class="input-field">
                                    <input type="password" name="user_password" id="user_password" v-model="user_password">
                                    <label for="user_password">Password</label>
                                </div>
                                <div class="input-field">
                                    <input type="password" name="user_password_confirmation" id="user_password_confirmation" v-model="user_password_confirmation">
                                    <label for="user_password_confirmation">Confirm Password</label>
                                </div>
                                <div class="step-actions">
                                    <button type="button" class="btn" @click="nextStep">Confirm</button>
                                </div>
                            </div>
                        </li>
                        <li class="step" id="selectSubscriptionStep"> <!-- Step 2 -->
                            <div class="step-title">Verification Information</div>
                            <div class="step-content">
                                <div class="row">
                                    <div class="col s8">
                                        <div class="input-field" style="margin-top: 2.3rem;">
                                            <input type="text" name="ccode" id="ccode" v-model="ccode">
                                            <label for="ccode">Confirmation Code</label>
                                        </div>
                                    </div>
                                    <div class="col s4" style="margin-top: 2.8rem;">
                                        <button type="button" class="btn" @click="sendCode" v-if="!isSending">SEND CODE</button>
                                        <button type="button" class="btn btn-flat disabled" v-if="isSending">
                                            <div class="preloader-wrapper small active" style="width:22px;height:22px;top:5px">
                                              <div class="spinner-layer spinner-green-only">
                                                <div class="circle-clipper left">
                                                  <div class="circle"></div>
                                                </div>
                                                <div class="gap-patch">
                                                  <div class="circle"></div>
                                                </div>
                                                <div class="circle-clipper right">
                                                  <div class="circle"></div>
                                                </div>
                                              </div>
                                            </div>
                                            SENDING
                                        </button>
                                    </div>
                                </div>
                                <div v-if="ccode && ccode == rcode">
                                    <p>
                                        <label style="float: left;">
                                            <input type="checkbox" name="terms" v-model="terms" />
                                            <span></span>
                                        </label>
                                        I have reviewed the <a href="https://home.conciergehealth.co/landing/activesite/terms-and-conditions" target="_blank">Terms and Conditions</a>
                                    </p>

                                    <div class="step-actions">
                                        <button type="button" @click="beforeSubmit" class="btn" :disabled="!terms">Register</button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection

@push('js')
<script src="{{ asset('widgets/mstepper/mstepper.min.js') }}"></script>
<script src="{{ asset('js/pages/welcome.js') }}"></script>
@endpush
