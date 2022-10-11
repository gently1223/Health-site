<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePayoutsTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('stripe_payout_customers')) {
            Schema::create('stripe_payout_customers', function (Blueprint $table) {
                $table->id();

                $table->integer('company_id');
                $table->integer('location_id');
                $table->integer('user_id');
                $table->string('stripe_customer_id');
                $table->string('stripe_payout_method_id')
                      ->nullable();

                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('stripe_payout_customers');
    }
}
