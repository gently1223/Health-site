@component('mail::message')
<h1>Welcome Corporate Verification Code</h1>
Please, use the following verification code for the welcome register step<br>
verification code: {{$verifyCode}}

Thanks,<br>
{{ config('app.name') }}
@endcomponent
