@extends('layouts.dashboard')

@section('content')
<div class="content">
    <div class="row">
        <div class="col s12">
            <table class="striped low-padding">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th width="200"></th>
                    </tr>
                </thead>

                <tbody>
                    @foreach ($invoices as $invoice)
                    <tr>
                        <td>{{ $invoice->price->product->name ?? '' }}</td>
                        <td>{{ $invoice->currency_symbol }}{{ number_format($invoice->amount/100, 2) }}</td>
                        <td>{{ ucfirst($invoice->status) }}</td>
                        <td>{{ $invoice->stripe_created_at->format('m/d/Y') }}</td>
                        <td>
                            <ul class="actionsList no-margin">
                                <li>
                                    <a href="{{ $invoice->url }}" target="_blank" class="btn-floating btn-small waves-effect waves-light green mainColorBackground"><i class="material-icons">receipt</i></a>
                                    <a href="{{ $invoice->pdf }}" class="btn-floating btn-small waves-effect waves-light green mainColorBackground"><i class="material-icons">download</i></a>
                                </li>
                            </ul>
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
