<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

    class  GmailService
{
    protected $clientId;
    protected $clientSecret;
    protected $refreshToken;

    public function __construct()
    {
        $this->clientId = env('GOOGLE_CLIENT_ID2');
        $this->clientSecret = env('GOOGLE_CLIENT_SECRET2');
        $this->refreshToken = env('GOOGLE_REFRESH_TOKEN2');
    }

    public function getAccessToken()
    {
        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'refresh_token' => $this->refreshToken,
            'grant_type' => 'refresh_token',
        ]);

        $data = $response->json();

        if (!isset($data['access_token'])) {
            throw new \Exception('Não foi possível gerar o access token do Gmail API.');
        }

        return $data['access_token'];
    }

    public function sendEmail($to, $subject, $body)
    {
        $accessToken = $this->getAccessToken();

        $rawMessage = "To: {$to}\r\n";
        $rawMessage .= "Subject: {$subject}\r\n";
        $rawMessage .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
        $rawMessage .= $body;

        $rawMessage = base64_encode($rawMessage);
        $rawMessage = str_replace(['+', '/'], ['-', '_'], $rawMessage); // Base64 URL-safe

        $response = Http::withToken($accessToken)
            ->post('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', [
                'raw' => $rawMessage,
            ]);

        if ($response->failed()) {
            throw new \Exception('Erro ao enviar email: ' . $response->body());
        }

        return $response->json();
    }
}
