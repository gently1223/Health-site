@extends('layouts.dashboard')

@section('content')
<div class="content" id="productsList">
    @if ($is_archive)
    <div class="row">
        <div class="input-field col s12">
            <h5 class="left">Products{{ $is_archive ? ': Archive' : '' }}</h5>
        </div>
    </div>
    @else
    <div class="row">
        <div class="input-field col s12">
            <h5 class="margin-0">Registration Fees</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th width="300">Stripe ID</th>
                        <th width="300">Product Name</th>
                        <th>Prices</th>
                        @if ($is_archive)
                        <th>Deactivated (Stripe side)</th>
                        @endif
                        <th width="600"></th>
                    </tr>
                </thead>

                <tbody>
                    @foreach ($register as $product)
                    <tr>
                        <td>{{ $product->stripe_id }}</td>
                        <td>{{ $product->name }}</td>
                        <td>{{ $product->prices_formatted }}</td>
                        @if ($is_archive)
                        <td>{{ $product->is_deleted_on_stripe_side ? 'Yes' : 'No' }}</td>
                        @endif

                        <td>
                            @if (!$product->is_deleted_on_stripe_side)
                            <ul class="actionsList no-margin">
                                <li>
                                    <a href="{{ route('root.products.prices', ['productId' => $product->id]) }}" class="btn-small waves-effect waves-light green mainColorBackground">Show Prices</a>
                                    <form class="display-inline" method="POST" action="{{ route('root.products.removeFromRegisterOptions', ['productId' => $product->id]) }}">
                                        @csrf
                                        <button type="submit" class="btn-small waves-effect waves-light orange">
                                            Remove From Register Fees
                                        </button>
                                    </form>
                                    <form class="display-inline" method="POST" action="{{ route('root.products.remove', ['productId' => $product->id]) }}">
                                        @csrf
                                        <button type="submit" class="btn-small waves-effect waves-light red">
                                            <i class="material-icons left">delete</i>Remove to Archive
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
    <hr />
    <div class="row">
        <div class="input-field col s12">
            <h5 class="margin-0 left">All Products</h5>
            <button type="button" class="btn right green mainColorBackground" @click="fetchProducts" :disabled="fetchDisabled">
                <i class="material-icons spinLoading" v-if="fetchDisabled">cached</i>
                <span v-else>Fetch Products</span>
            </button>
        </div>
    </div>
    @endif
    <div class="row">
        <div class="col s12">
            @if ($is_archive)
            <a href="{{ route('root.products') }}" class="btn right green mainColorBackground">Back to Products</a>
            @else
            <a href="{{ route('root.products.archive') }}" class="btn right green mainColorBackground">To archive</a>
            @endif
        </div>
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th width="300">Stripe ID</th>
                        <th width="300">Product Name</th>
                        <th>Prices</th>
                        @if ($is_archive)
                        <th>Deactivated (Stripe side)</th>
                        @endif
                        <th width="{{ $is_archive ? 200 : 600 }}"></th>
                    </tr>
                </thead>

                <tbody>
                    @foreach ($products as $product)
                    <tr>
                        <td>{{ $product->stripe_id }}</td>
                        <td>{{ $product->name }}</td>
                        <td>{{ $product->prices_formatted }}</td>
                        @if ($is_archive)
                        <td>{{ $product->is_deleted_on_stripe_side ? 'Yes' : 'No' }}</td>
                        @endif

                        <td>
                            @if (!$product->is_deleted_on_stripe_side)
                            <ul class="actionsList no-margin">
                                <li>
                                    @if (!$is_archive)
                                        <a href="{{ route('root.products.prices', ['productId' => $product->id]) }}" class="btn-small waves-effect waves-light green mainColorBackground">Show Prices</a>
                                        @if ($product->is_allowed_for_registration && !$product->is_for_register)
                                        <form class="display-inline" method="POST" action="{{ route('root.products.setAsRegisterOption', ['productId' => $product->id]) }}">
                                            @csrf
                                            <button type="submit" class="btn-small waves-effect waves-light orange">
                                                Add To Register Fees
                                            </button>
                                        </form>
                                        @endif
                                    @endif
                                    <form class="display-inline" method="POST" action="{{ $is_archive ? route('root.products.restore', ['productId' => $product->id]) : route('root.products.remove', ['productId' => $product->id]) }}">
                                        @csrf
                                        <button type="submit" class="btn-small waves-effect waves-light {{ $is_archive ? 'green' : 'red' }}">
                                            {!! $is_archive ? 'Restore' : '<i class="material-icons left">delete</i>Remove to Archive' !!}
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
<script src="{{ asset('js/pages/root/products.js') }}"></script>
@endpush
