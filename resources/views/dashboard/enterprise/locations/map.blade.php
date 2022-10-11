@extends('layouts.dashboard')

@section('content')
<div class="content" id="browseMap">
    <div class="pageLoading">
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
    {!! Mapper::render() !!}
</div>
@endsection

@push('js')
<script>
$(document).ready(function(){
    setTimeout(() => {
        $('.pageLoading').hide();
    }, 3000);
});
</script>
@endpush
