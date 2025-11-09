<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\GmailService;

class EmailController extends Controller
{
    protected $gmail;

    public function __construct(GmailService $gmail)
    {
        $this->gmail = $gmail;
    }

    // Rota para enviar email real de recuperação ou notificação
    public function sendEmail(Request $request)
    {
        $request->validate([
            'to' => 'required|email',
            'subject' => 'required|string',
            'body' => 'required|string',
        ]);

        try {
            $result = $this->gmail->sendEmail(
                $request->to,
                $request->subject,
                $request->body
            );

            return response()->json([
                'message' => 'Email enviado com sucesso!',
                'result' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
