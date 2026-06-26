import "dotenv/config";

const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "openai/gpt-oss-120b:free";

if (!API_KEY) {
  console.error("Erro: crie o arquivo .env com a propriedade OPENROUTER_API_KEY.");
  process.exit(1);
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

async function chamarLLM(): Promise<void> {
  console.log("Enviando requisição para o OpenRouter...");
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", 
        "X-OpenRouter-Title": "Trabalho LLM"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `Você é um Professor de Programação focado em alunos iniciantes de Análise e Desenvolvimento de Sistemas (ADS). 
            Seu objetivo é ensinar de forma didática, utilizando analogias do mundo real e exemplos de código curtos e comentados. 
            Diretrizes:
            - Sempre valide o raciocínio do aluno antes de dar a resposta pronta.
            - Caso o aluno mande uma dúvida sobre um erro de código, explique o PORQUÊ do erro acontecer e dê a solução de forma construtiva.
            - Sempre termine a explicação propondo um pequeno desafio ou exercício rápido relacionado ao assunto para o aluno praticar.` 
            
    
          },
          {
            role: "user",
            content: "Professor, meu código JavaScript está dando 'Cannot read properties of undefined (reading 'split')'. O que significa isso e como resolvo?"
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 500
      })
    });

    if (!response.ok) {
      const detalhe = await response.text();
      throw new Error(`Erro na API (${response.status}): ${detalhe}`);
    }

    const data = (await response.json()) as OpenRouterResponse;
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("A API respondeu, mas não retornou texto.");
    }

    console.log("\n=================================");
    console.log("Resposta da IA:");
    console.log("=================================");
    console.log(text);
    console.log("=================================\n");

  } catch (error: any) {
    console.error("Falha ao chamar o OpenRouter:");
    console.error(error.message);
  }
}

chamarLLM();