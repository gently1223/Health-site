<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateIntegrationCredentialsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('integration_credentials')) {
            Schema::create('integration_credentials', function (Blueprint $table) {
                $table->id();

                $table->foreignId('user_id')->index();

                $table->string('provider'); // IntegrationProviderEnum
                $table->string('token_type');
                $table->string('access_token');
                $table->string('refresh_token');
                $table->dateTime('expires_at');

                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('user')->onDelete('cascade');
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
        Schema::dropIfExists('integration_credentials');
    }
}
