<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MatiaSistemas - Cérebro da Aplicação</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    
    <style>
        /* Fundo Cinza Degradê Escuro */
        body {
            background: #1e1f24; /* Base escura */
            background: linear-gradient(180deg, #1e1f24 0%, #0d0d10 100%);
            min-height: 100vh;
            color: #f8f9fa;
        }

        /* Estilo da Navbar */
        .navbar {
            background-color: transparent !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Espaço para o Logo Personalizado (Exemplo) */
        .custom-logo {
            height: 30px; /* Ajuste conforme a altura do seu logo */
            margin-right: 10px;
        }

        /* Elemento Central - Sugestão de Animação */
        .cube-container {
            position: relative;
            width: 300px;
            height: 300px;
            margin: 4rem auto 3rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Simulação do Cubo e Fluxo de Dados */
        .data-flow-cube {
            width: 100%;
            height: 100%;
            border: 2px solid rgba(0, 150, 255, 0.4); 
            transform: rotateY(45deg) rotateX(35deg);
            background-color: rgba(0, 50, 100, 0.1);
            box-shadow: 0 0 50px rgba(0, 150, 255, 0.2);
            position: absolute;
            opacity: 0.8;
        }
        
        .core-leaf {
            font-size: 3rem;
            color: #48d1cc; 
            text-shadow: 0 0 15px #48d1cc;
            z-index: 10;
        }

        /* Estilo dos Cards */
        .feature-card {
            background-color: #2a2b30;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s ease;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 150, 255, 0.2);
        }
        
        .feature-card i {
            font-size: 2rem;
            color: #48d1cc;
        }

        /* Botão */
        .btn-custom {
            background-color: #007bff;
            border-color: #007bff;
            color: white;
            transition: background-color 0.3s ease;
        }
        .btn-custom:hover {
            background-color: #0056b3;
        }

    </style>
</head>
<body>

    <nav class="navbar navbar-expand-lg navbar-dark sticky-top">
    <div class="container">
        <a class="navbar-brand d-flex align-items-center" href="#">
            <img src="{{ asset('images/MatiaSistemas.png') }}" alt="Logo MatiaSistemas" class="custom-logo">
            <span class="fw-bold">MATIAISTEMAS | BACKEND</span>
        </a>
        <div class="d-flex">
            <a href="https://sismatias.onrender.com/" class="btn btn-outline-info me-2 fw-bold" target="_blank">IR PARA PARTE VISUAL</a>
        </div>
    </div>
</nav>

    <main class="container text-center py-5">
        
        <div class="mb-4 text-secondary">
            <p class="mb-1">
                Versão do Sistema: ** 1.0.2025 ** 
            </p>
            <p class="alert alert-dark d-inline-block p-2 mt-3">
                Para entrar em comunicação, por favor, contacte-me: Matias **   937505622   **
            </p>
        </div>

        <h1 class="display-3 fw-bold text-white mb-3 mt-5">O CÉREBRO DA SUA APLICAÇÃO</h1>
        <p class="lead text-secondary mb-5">
            A fundação lógica, segura e escalável para um desenho frontal .
        </p>

        <div class="cube-container">
            <div class="data-flow-cube"></div>
            <i class="fas fa-microchip core-leaf"></i> 
        </div>

        <div class="row g-4 pt-5">
            
            <div class="col-md-4">
                <div class="feature-card h-100">
                    <i class="fas fa-network-wired mb-3"></i>
                    <h5 class="fw-bold">API LÓGICA</h5>
                    <p class="text-secondary">Conexões inteligentes e seguras para seus dados.</p>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="feature-card h-100">
                    <i class="fas fa-database mb-3"></i>
                    <h5 class="fw-bold">DADOS SINFÔNICOS</h5>
                    <p class="text-secondary">Sua base de dados orquestrada e criptografada.</p>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="feature-card h-100">
                    <i class="fas fa-bolt mb-3"></i>
                    <h5 class="fw-bold">PERFORMANCE DINÂMICA</h5>
                    <p class="text-secondary">Aplicação otimizada e escalavel .</p>
                </div>
            </div>
            
        </div>
        
        <div class="mt-5">
            <a href="#" class="btn btn-custom btn-lg px-5">VER PERFIL DO PROGRAMADOR ANTONIO MATIAS</a>
            <p class="mt-2 text-secondary small"> Framework | seguro </p>
        </div>

    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>