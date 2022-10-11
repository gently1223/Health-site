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
                        <h4 class="center-align margin-0">Search or create a brand</h4>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <form method="POST" action="{{ route('register') }}" ref="registerForm">
                    @csrf
                    <input type="hidden" name="registration_type" v-model="type">

                    <ul class="stepper linear">
                        <li class="step active"> <!-- Step 0 -->
                            <template v-if="type == 'join_to_company'">
                                <div class="step-title">Choose Brand</div>
                                <div class="step-content">
                                    <input type="hidden" name="company_id" id="company_id" v-model="company_id">
                                    <div class="input-field">
                                        <input type="text" name="search_company" id="search_company" v-model="search_company">
                                        <label for="search_company">Search Brand by Name</label>
                                    </div>

                                    <ul class="collection" v-if="companies.length > 0">
                                        <li class="collection-item" v-for="company in companies" @click="selectCompany(company.id)" :class="{'active': company.id == company_id}">@{{ company.name }}</li>
                                    </ul>

                                   <!--  <div class="step-actions">
                                        <button type="button" class="btn btn-flat" @click="type = 'new_company'">Create new Brand</button>
                                    </div> -->
                                </div>
                            </template>
                            <template v-else>
                                <div class="step-title">New Brand</div>
                                <div class="step-content">
                                    <div class="input-field">
                                        <input type="text" name="company_name" id="company_name" v-model="company_name">
                                        <label for="company_name">Enter Brand Name</label>
                                    </div>

                                    <div class="step-actions">
                                        <button type="button" class="btn" @click="nextStep">Confirm</button>
                                        <button type="button" class="btn btn-flat" @click="type = 'join_to_company'">Search Brand</button>
                                    </div>
                                </div>
                            </template>
                        </li>
                        <li class="step"> <!-- Step 1 -->
                            <div class="step-title">Create Location</div>
                            <div class="step-content">
                                <div class="input-field">
                                    <input type="text" name="location_club_id" id="location_club_id" v-model="location_club_id">
                                    <label for="location_club_id">Club ID</label>
                                </div>
                                <div class="input-field">
                                    <input type="text" name="location_name" id="location_name" v-model="location_name">
                                    <label for="location_name">Primary Location</label>
                                </div>
                                <div class="input-field">
                                    <input type="text" name="location_address" id="location_address" v-model="location_address">
                                    <label for="location_address">Address</label>
                                </div>
                                <div class="input-field">
                                    <input type="text" name="location_city" id="location_city" v-model="location_city">
                                    <label for="location_city">City</label>
                                </div>
                                <div class="input-field">
                                    <input type="text" name="location_state" id="location_state" v-model="location_state">
                                    <label for="location_state">State</label>
                                </div>
                                <div class="input-field">
                                    <input type="text" name="location_postal" id="location_postal" v-model="location_postal">
                                    <label for="location_postal">Postal</label>
                                </div>
                                <div class="input-field">
                                    <input type="text" name="location_phone" id="location_phone" v-model="location_phone">
                                    <label for="location_phone">Phone</label>
                                </div>

                                <div class="step-actions">
                                    <button type="button" class="btn" @click="nextStep">Confirm</button>
                                </div>
                            </div>
                        </li>
                        <li class="step" id="selectSubscriptionStep"> <!-- Step 2 -->
                            <div class="step-title">Select Plan</div>
                            <div class="step-content">
                                <input type="hidden" name="subscription_id" v-model="subscription_id" />
                                <input type="hidden" name="price_id" v-model="price_id" />
                                <template v-for="product in products">
                                    <div v-for="price in product.prices" v-if="!price.is_subscription" class="card horizontal cursor-pointer registerPrices" :class="{'active': price_id == price.id, 'hidden': totalDiscount}" @click="setPrice(product.id, price.id)">
                                        <div class="card-stacked">
                                            <div class="card-content">
                                                <h5 class="margin-top-0">@{{ product.name }}</h5>
                                                <p>@{{ product.description }}</p>
                                            </div>
                                            <div class="card-action">
                                                <div class="right-align">
                                                    @{{ price.price }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </template>

                                <div class="input-field" style="margin-top: 2.3rem;">
                                    <input type="text" name="promocode" id="promocode" v-model="promocode">
                                    <label for="promocode">Promocode</label>
                                </div>

                                <div class="step-actions">
                                    <button type="button" class="btn" @click="nextStep">Confirm</button>
                                </div>
                            </div>
                        </li>
                        <li class="step" id="selectShipmentStep"> <!-- Step 3 -->
                            <div class="step-title">Shipment Options</div>
                            <div class="step-content">
                                <p>
                                    <label>
                                        <input name="shipment_same_address" v-model="shipment_same_address" value="1" type="radio" />
                                        <span>Location Address</span>
                                    </label>
                                </p>
                                <p>
                                    <label>
                                        <input name="shipment_same_address" v-model="shipment_same_address" value="0" type="radio" />
                                        <span>Other Address</span>
                                    </label>
                                </p>
                                <div v-if="shipment_same_address == '0'">
                                    <p>
                                        Please fill the shipment address below.
                                    </p>
                                    <div class="input-field" style="padding-top: 10px;">
                                        <input type="text" name="shipment_address" id="shipment_address" v-model="shipment_address">
                                        <label for="shipment_address">Shipment Address</label>
                                    </div>
                                    <div class="input-field">
                                        <input type="text" name="shipment_city" id="shipment_city" v-model="shipment_city">
                                        <label for="shipment_city">Shipment City</label>
                                    </div>
                                    <div class="input-field">
                                        <input type="text" name="shipment_state" id="shipment_state" v-model="shipment_state">
                                        <label for="shipment_state">Shipment State</label>
                                    </div>
                                    <div class="input-field">
                                        <input type="text" name="shipment_postal" id="shipment_postal" v-model="shipment_postal">
                                        <label for="shipment_postal">Shipment Postal</label>
                                    </div>
                                </div>

                                <div class="step-actions">
                                    <button type="button" class="btn" @click="nextStep">Confirm</button>
                                </div>
                            </div>
                        </li>
                        <li class="step"> <!-- Step 4 -->
                            <div class="step-title">Enter Card</div>
                            <div class="step-content">
                                <input type="hidden" name="stripe_token" v-model="stripe_token" />
                                <div class="row">
                                    <div class="col s12">
                                        <div class="input-field">
                                            <input type="text" id="card_holder" v-model="card_holder">
                                            <label for="card_holder">Card Holder</label>
                                        </div>
                                    </div>

                                    <div class="col s12">
                                        <div class="input-field">
                                            <input type="text" id="card_number" v-model="card_number" @keyup="formatCard">
                                            <label for="card_number">Card Number</label>
                                        </div>
                                    </div>

                                    <div class="col s3">
                                        <div class="input-field">
                                            <input type="text" id="card_valid_month" v-model="card_valid_month">
                                            <label for="card_valid_month">MM</label>
                                        </div>
                                    </div>

                                    <div class="col s3">
                                        <div class="input-field">
                                            <input type="text" id="card_valid_year" v-model="card_valid_year">
                                            <label for="card_valid_year">YY</label>
                                        </div>
                                    </div>

                                    <div class="col s3 offset-s3">
                                        <div class="input-field">
                                            <input type="password" id="card_cvc" v-model="card_cvc">
                                            <label for="card_cvc">CVC</label>
                                        </div>
                                    </div>
                                </div>

                                <div class="step-actions">
                                    <button type="button" class="btn" @click="nextStep">Confirm</button>
                                </div>
                            </div>
                        </li>
                        <li class="step"> <!-- Step 5 -->
                            <div class="step-title">Create Account</div>
                            <div class="step-content">
                                <div class="input-field">
                                    <input type="email" name="user_email" id="user_email" v-model="user_email">
                                    <label for="user_email">Email</label>
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

                                <p>
                                    <label style="float: left;">
                                        <input type="checkbox" name="terms" v-model="terms" />
                                        <span></span>
                                    </label>
                                    I have reviewed the <a href="https://home.conciergehealth.co/landing/activesite/terms-and-conditions" target="_blank">Terms and Conditions</a>
                                </p>

                                <div class="step-actions">
                                    <button type="button" @click="beforeSubmit" class="btn">Register</button>
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
<script>
window.Laravel.products   = {!! json_encode($products); !!};
</script>
<script src="{{ asset('widgets/mstepper/mstepper.min.js') }}"></script>
<script src="{{ asset('js/pages/register.js') }}"></script>
@endpush
