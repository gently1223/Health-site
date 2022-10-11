<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStripeTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('stripe_products')) {
            Schema::create('stripe_products', function (Blueprint $table) {
                $table->id();

                $table->string('stripe_id')
                      ->unuque();

                $table->string('name');
                $table->string('description');

                $table->timestamp('stripe_created_at');
                $table->timestamp('stripe_updated_at');
                $table->boolean('is_deleted_on_stripe_side')->default(false);
                $table->boolean('is_for_register')->default(false)->index();

                $table->timestamps();
                $table->softDeletes('deleted_at', 0);
            });

            Schema::create('stripe_product_prices', function (Blueprint $table) {
                $table->id();

                $table->string('stripe_id')
                      ->unuque();
                $table->string('stripe_product_id')->index();
                $table->string('type');

                $table->string('interval')->nullable();
                $table->integer('interval_count')->nullable();
                $table->integer('trial_period_days')->nullable();

                $table->string('currency');
                $table->integer('amount');

                $table->string('name');
                $table->timestamp('stripe_created_at');
                $table->boolean('is_deleted_on_stripe_side')->default(false);

                $table->timestamps();
                $table->softDeletes('deleted_at', 0);
            });

            Schema::create('stripe_subscriptions', function (Blueprint $table) {
                $table->id();

                $table->string('stripe_id')
                      ->unuque();
                $table->string('stripe_customer_id')
                      ->index();
                $table->string('stripe_price_id')
                      ->index();

                $table->string('status');

                $table->timestamp('stripe_trial_start_at');
                $table->timestamp('stripe_trial_end_at');

                $table->timestamp('stripe_start_at');
                $table->timestamp('stripe_period_start_at');
                $table->timestamp('stripe_period_end_at');

                $table->timestamp('stripe_created_at');
                $table->timestamp('stripe_cancelled_at')->nullable();

                $table->timestamps();
                $table->softDeletes('deleted_at', 0);
            });

            Schema::create('stripe_invoices', function (Blueprint $table) {
                $table->id();

                $table->string('stripe_id')
                      ->unuque();
                $table->string('stripe_customer_id')
                      ->index();
                $table->string('stripe_price_id')
                      ->nullable()
                      ->index();
                $table->string('stripe_subscription_id')
                      ->nullable()
                      ->index();

                $table->string('url');
                $table->string('pdf');

                $table->string('status');
                $table->string('currency');
                $table->integer('amount');

                $table->timestamp('stripe_created_at');

                $table->timestamps();
                $table->softDeletes('deleted_at', 0);
            });

            Schema::table('locations', function (Blueprint $table) {
                $table->string('stripe_customer_id')
                      ->nullable();
                $table->boolean('is_register_fee_purchased')
                      ->default(false);
                $table->boolean('is_register_fee_not_required')
                      ->default(false);
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
        Schema::table('locations', function (Blueprint $table) {
            $table->dropColumn(['stripe_customer_id', 'is_register_fee_purchased', 'is_register_fee_not_required']);
        });
        Schema::dropIfExists('stripe_invoices');
        Schema::dropIfExists('stripe_subscriptions');
        Schema::dropIfExists('stripe_product_prices');
        Schema::dropIfExists('stripe_products');
    }
}
