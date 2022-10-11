@extends('layouts.dashboard')

@section('content')
<div class="content" id="subscriptionsList">
    <div class="row">
        <div class="input-field col s12">
            <h5 class="left">Prices for {{ $product->name }}{{ $is_archive ? ': Archive' : '' }}</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <a href="{{ route('root.products') }}" class="btn left green mainColorBackground">Back to Products</a>
            @if ($is_archive)
            <a href="{{ route('root.products.prices', ['productId' => $product->id]) }}" class="btn right green mainColorBackground">Back to Prices</a>
            @else
            <a href="{{ route('root.products.prices.archive', ['productId' => $product->id]) }}" class="btn right green mainColorBackground">To archive</a>
            @endif
        </div>
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th>Stripe ID</th>
                        <th>Type</th>
                        <th>Price Name</th>
                        <th>Price</th>
                        <th>Interval</th>
                        <th>Trial Period Days</th>
                        @if ($is_archive)
                        <th>Deactivated (Stripe side)</th>
                        @endif
                        <th width="150"></th>
                    </tr>
                </thead>

                <tbody>
                    @foreach ($prices as $price)
                    <tr>
                        <td>{{ $price->stripe_id }}</td>
                        <td>{{ $price->type }}</td>
                        <td>{{ $price->name }}</td>
                        <td>{{ $price->currency_symbol }}{{ $price->amount/100 }}</td>
                        <td>{{ $price->interval }}{{ $price->interval_count ? ' ('. $price->interval_count .')' : '' }}</td>
                        <td>{{ $price->trial_period_days }}</td>
                        @if ($is_archive)
                        <td>{{ $price->is_deleted_on_stripe_side ? 'Yes' : 'No' }}</td>
                        @endif

                        <td>
                            @if (!$price->is_deleted_on_stripe_side)
                            <ul class="actionsList no-margin">
                                <li>
                                    <form class="display-inline" method="POST" action="{{ $is_archive ? route('root.products.prices.restore', ['productId' => $product->id, 'priceId' => $price->id]) : route('root.products.prices.remove', ['productId' => $product->id, 'priceId' => $price->id]) }}">
                                        @csrf
                                        <button type="submit" class="btn-floating btn-small waves-effect waves-light green mainColorBackground">
                                            @if ($is_archive)
                                            <i class="material-icons">add</i>
                                            @else
                                            <i class="material-icons">remove</i>
                                            @endif
                                        </button>
                                    </form>
                                </li>
                            </ul>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection

@push('js')
@endpush
