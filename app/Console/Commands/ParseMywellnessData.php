<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use App\Services\Integrations\MyWellness;
use App\Models\Integration\IntegrationCredential;
use Illuminate\Console\Command;

class ParseMywellnessData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'parse:mywellness {--debug= : Debug}
                                             {--date= : Specify Parsing Date}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Get members mywellness data';

    /**
     * The console command debug message key.
     *
     * @var string
     */
    protected $infoMessageKey = '[Parse: MyWellness Data]';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $this->showMsg('Started');

        $date = $this->option('date') ?: null;
        $myWellness = new MyWellness();
        $tokens = IntegrationCredential::where('provider', 'mywellness')->get();

        foreach ($tokens as $token) {
            $this->showMsg('Parsing data for User #'.$token->user_id);
            $result = $myWellness->parseData($token, $date);

            if ($result['success'] == false) {
                $this->showMsg('Error ocured. Seems like rate limit reached.');
                return;
            }

            if ($tokens->count() > 1) {
                $this->showMsg('Since rate limit is 5500 per day we can make request each 20 seconds. Sleep for 20 seconds...');
                sleep(20);
            }
        }

        $this->showMsg('Done');
    }

    /**
     * Show logs
     * @param [string] $msg  [Content of message]
     * @param [string] $type [Type of message]
     * @return null
    */
    private function showMsg($msg, $type = null)
    {
        if ($this->option('debug')) {
            switch ($type) {
                case 'warning':
                    $this->warn(Carbon::now()->format('Y-m-d H:i:s').' - '. $this->infoMessageKey .' '.$msg);
                break;

                case 'error':
                    $this->error(Carbon::now()->format('Y-m-d H:i:s').' - '. $this->infoMessageKey .' '.$msg);
                break;

                default:
                    $this->info(Carbon::now()->format('Y-m-d H:i:s').' - '. $this->infoMessageKey .' '.$msg);
            }
        }
    }
}
