import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = 3000;
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "openai/gpt-oss-120b:free";

if (!API_KEY) {
  console.error("Erro: configure OPENROUTER_API_KEY no arquivo .env.");
  process.exit(1);
}

// Configurações do Express
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve os arquivos da pasta public

// Rota de teste para validar se o servidor está online
app.get("/api/status", (req: Request, res: Response) => {
  res.json({ status: "API do Professor funcionando", model: MODEL });
});

// Interface para a resposta do OpenRouter
interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

// Rota principal que o HTML vai chamar
app.post("/api/llm", async (req: Request, res: Response): Promise<any> => {
  try {
    const { prompt } = req.body;

    // Validações básicas de entrada
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ erro: "Por favor, digite uma dúvida para o professor." });
    }
    if (prompt.length > 2000) {
      return res.status(400).json({ erro: "Limite: 2000 caracteres." });
    }

    // Chamada para o OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-OpenRouter-Title": "Professor de Programacao ADS"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `Você é um Professor de Programação focado em alunos iniciantes de Análise e Desenvolvimento de Sistemas (ADS). 
            Seu objetivo é ensinar de forma extremamente didática, utilizando analogias do mundo real e exemplos de código curtos e comentados.
            Diretrizes:
            - Sempre valide o raciocínio do aluno antes de dar a resposta pronta.
            - Explique o PORQUÊ do erro ou do conceito acontecer de forma construtiva.
            - Sempre termine a explicação propondo um pequeno desafio prático rápido ou uma pergunta de fixação para o aluno responder.`
          },
          {
            role: "user",
            content: prompt // Dúvida vinda da página HTML
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 800
      })
    });

    if (!response.ok) {
      const detalhe = await response.text();
      return res.status(502).json({
        erro: "Erro ao consultar o OpenRouter.",
        status: response.status,
        detalhe
      });
    }

    const data = (await response.json()) as OpenRouterResponse;
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(502).json({ erro: "Resposta vazia ou inesperada da IA." });
    }

    // Retorna a resposta estruturada para o front-end
    res.json({ resposta: text });

  } catch (error: any) {
    res.status(500).json({ erro: "Erro interno no servidor.", detalhe: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});