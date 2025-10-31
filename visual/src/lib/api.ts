import axios from "axios";

// na rede local
//http://${typeof window !== "undefined" ? window.location.hostname : "192.168.137.1"}:8000`;


const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||

  `http://${typeof window !== "undefined" ? window.location.hostname : "192.168.137.1"}:8000`;

const api = axios.create({
  baseURL: `${BASE_URL}/api`, // ✅ só a API normal
  withCredentials: true,     // 🚨 desliga cookies
  timeout: 10000,
});

// ❌ Não precisas mais do getCsrfCookie, podes remover
// export const getCsrfCookie = async () => { ... }


 //🚨 Função auxiliar para pegar o cookie CSRF (rota do Laravel NÃO usa /api)
export const getCsrfCookie = async () => {
  await axios.get(`${BASE_URL}/sanctum/csrf-cookie`, {

    withCredentials: true,


     headers: {
    'Accept': 'application/json',
  }

  });

};



api.interceptors.request.use((config) => {

   const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
/*  
  console.log("📤 REQUEST:", {
    url: config.url,
    method: config.method,
    headers: config.headers,
    data: config.data,
  });

  */
  return config;
});

export default api;
