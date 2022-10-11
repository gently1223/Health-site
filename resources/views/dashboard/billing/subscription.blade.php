@extends('layouts.dashboard')

@section('content')
<div class="content">
    <div class="row">
        <div class="col s12">
            <h5>Subscription</h5>
        </div>
    </div>
    @if ($subscription)
    <div class="row">
        <div class="col s12">
            <ul>
                <li>Status: {{ $subscription->status }}</li>
                <li>Active subscription: {{ $subscription->price->product->name }}</li>
                <li>Price: {{ $subscription->price->currency_symbol }}{{ number_format($subscription->price->amount/100, 2) }}</li>
                <li>Next payment: {{ $subscription->stripe_period_end_at }}</li>
            </ul>
        </div>
    </div>
    @endif
</div>
@endsection

@push('js')
@endpush
