@extends('layouts.dashboard')

@section('content')
<div class="content">
    <div class="row padding-top-20">
        <div class="col s12">
            <div class="buttons right">
                @if ($stripeAccount)
                <a href="{{ route('billing.account.redirect') }}" id="stripe-connect" class="button small green">Update <b>bank</b> account</a>
                @else
                <a href="{{ route('billing.account.redirect') }}" id="stripe-connect" class="button small green">Add <b>bank</b> account</a>
                @endif
            </div>
        </div>
    </div>
    @if ($card && !$feePaid)
    <div class="row">
        @foreach ($products as $product)
            @foreach ($product->prices as $price)
                @if (!$price->is_subscription)
                <div class="col s12">
                    <form action="{{ route('billing.pay', ['productId' => $product->id, 'priceId' => $price->id]) }}" method="POST">
                        @csrf
                        <div class="card horizontal registerPrices">
                            <div class="card-stacked">
                                <div class="card-content">
                                    <h5 class="margin-top-0">{{ $product->name }}</h5>
                                    <p>{{ $product->description }}</p>
                                </div>
                                <div class="card-action">
                                    <div class="input-field left input-field-with-button">
                                        <input type="text" name="promocode" id="promocode">
                                        <label for="promocode">Promocode</label>
                                    </div>
                                    <div class="right-align">
                                        <button type="submit" class="btn green mainColorBackground">Purchase: {{ $price->price }}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                @endif
            @endforeach
        @endforeach
    </div>
    @endif


    <div class="row">
        <div class="col s12">
            <div class="card">
                <form action="{{ route('billing.card') }}" method="POST" id="cardForm">
                    @csrf
                    <div class="card-content">
                        <span class="card-title">Billing: Card</span>
                        @if ($card)
                        <p>Credit Card: {{ $card->brand }} **** **** **** {{ $card->last4 }}</p>
                        @endif
                        <div class="row changeCardForm @if ($card) hide @endif">
                            <div class="card-line"></div>
                            <div class="col s12">
                                <div class="input-field">
                                    <input type="text" id="card_holder" name="card_holder">
                                    <label for="card_holder">Card Holder</label>
                                </div>
                            </div>

                            <div class="col s12">
                                <div class="input-field">
                                    <input type="text" id="card_number" name="card_number">
                                    <label for="card_number">Card Number</label>
                                </div>
                            </div>

                            <div class="col s3">
                                <div class="input-field">
                                    <input type="text" id="card_valid_month" name="card_valid_month">
                                    <label for="card_valid_month">MM</label>
                                </div>
                            </div>

                            <div class="col s3">
                                <div class="input-field">
                                    <input type="text" id="card_valid_year" name="card_valid_year">
                                    <label for="card_valid_year">YY</label>
                                </div>
                            </div>

                            <div class="col s3 offset-s3">
                                <div class="input-field">
                                    <input type="password" id="card_cvc" name="card_cvc">
                                    <label for="card_cvc">CVC</label>
                                </div>
                            </div>
                        </div>

                        <div class="step-actions">
                        </div>
                    </div>
                    <div class="card-action">
                        <div class="right changeCardForm @if ($card) hide @endif">
                            @if ($card)
                            <button type="button" class="btn-flat" id="cancelChangeCard">Cancel</button>
                            @endif
                            <button type="submit" class="btn green mainColorBackground">
                                @if (!$feePaid)
                                Confirm and pay register fee: {{ $products->first()->prices->first()->price }}
                                @else
                                Confirm
                                @endif
                            </button>
                        </div>
                        @if ($card)
                        <button type="button" class="btn btn-xs green mainColorBackground right" id="changeCard">Change</button>
                        @endif
                        <div class="clearfix"></div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection

@push('js')
<script src="{{ asset('js/pages/card.js') }}"></script>
@endpush
