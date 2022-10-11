@extends('layouts.dashboard')

@push('css')
<link href="{{ asset('widgets/mstepper/mstepper.min.css') }}" rel="stylesheet" />
@endpush

@section('content')
<div class="content" id="clubLocationCreate">
    <div class="row">
        <div class="col s12">
            <h5>Club Locations: Add</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s8 offset-s2">
            <form method="post" action="{{ route('club.locations.slave') }}" ref="slaveLocationForm">
                @csrf
                <ul class="stepper linear">
                    <li class="step active">
                        <div class="step-title">Location information</div>

                        <div class="step-content">
                            <div class="card-panel">
                                <div class="card-content">
                                    <span class="card-title grey-text text-darken-4">Please fill the location information</span>

                                    <div class="row">
                                        <div class="input-field col s12">
                                            <input type="text" name="location_club_id" id="club_id" v-model="location_club_id">
                                            <label for="club_id">Club ID</label>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="input-field col s12">
                                            <input type="text" name="location_name" id="name" v-model="location_name">
                                            <label for="name">Name</label>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="input-field col s4">
                                            <input type="text" name="location_state" id="state" id="state" v-model="location_state">
                                            <label for="state">State</label>
                                        </div>

                                        <div class="input-field col s4">
                                            <input type="text" name="location_city" id="city" id="city" v-model="location_city">
                                            <label for="city">City</label>
                                        </div>

                                        <div class="input-field col s4">
                                            <input type="text" name="location_postal" id="postal" id="postal" v-model="location_postal">
                                            <label for="postal">Postal</label>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="input-field col s6">
                                            <input type="text" name="location_address" id="address" id="address" v-model="location_address">
                                            <label for="address">Address</label>
                                        </div>

                                        <div class="input-field col s6">
                                            <input type="text" name="location_phone" id="phone" id="phone" v-model="location_phone">
                                            <label for="phone">Phone</label>
                                        </div>
                                    </div>
                                </div>
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
                                <div v-for="price in product.prices" v-if="!price.is_subscription" class="card horizontal cursor-pointer registerPrices" :class="{'active': price_id == price.id}" @click="setPrice(product.id, price.id)">
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

                            <div class="step-actions">
                                <button type="button" class="btn" @click="nextStep">Confirm</button>
                            </div>
                        </div>
                    </li>
                    <li class="step" id="selectShipmentStep"> <!-- Step 3 -->
                        <div class="step-title">Shipment Options</div>
                        <div class="step-content">
                            <div class="card-panel">
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
                            </div>

                            <div class="step-actions">
                                <button type="button" class="btn" @click="beforeSubmit">Finish</button>
                            </div>
                        </div>
                    </li>
                </ul>
            </form>
        </div>
    </div>
</div>
@endsection

@push('js')
<script>
window.Laravel.products = {!! json_encode($products); !!};
</script>
<script src="{{ asset('widgets/mstepper/mstepper.min.js') }}"></script>
<script src="{{ asset('js/pages/club/locations.js') }}"></script>
@endpush
