
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBotResponse = async (userMessage: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        systemInstruction: `
          Você é o assistente oficial de vendas do ${context}. 💙
          Sua missão é vender planos de aluguel do BLUE BOT de forma profissional, clara e persuasiva.
          
          RESPOSTA OBRIGATÓRIA SOBRE O DONO:
          Se alguém perguntar quem é seu dono, criador ou administrador, responda EXATAMENTE:
          "Meu Dono: Pedro bots Contato: +55 99 98117-5724"
          
          REGRAS DE OURO:
          1. Identidade: Você é um bot de vendas 24h. Seu dono é o Pedro Bots.
          2. Link Oficial: Sempre que oportuno, utilize o link: https://bit.ly/4jfm9Yf
          3. Preços: Os preços não aparecem na vitrine inicial, apenas quando o cliente escolhe um plano (checkout).
          4. Funcionalidades: Automatização 24h, gestão de grupos, envios em massa, anti-trava e suporte VIP.
          5. Processo de Venda: 
             - Cumprimente o cliente com entusiasmo.
             - Explique os benefícios do bot.
             - Peça para ele escolher um dos planos na tela.
             - Após a escolha, ele deve preencher o formulário para gerar o pedido.
          6. Tom de Voz: Amigável, "vibe" tecnológica (cyber/neon), prestativo. Use emojis azuis 💙.
          7. Mensagem de Fechamento: Sempre incentive a finalização via Pix e o envio do comprovante para o Pedro Bots para ativação imediata via comando .addaluguel.
        `,
        temperature: 0.7,
      },
    });
    return response.text || "Olá! Sou o assistente do BLUE BOT. Como posso te ajudar? Se precisar do meu dono, o Pedro Bots está no +55 99 98117-5724.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Meu Dono: Pedro bots Contato: +55 99 98117-5724. Como posso te ajudar com os planos hoje? 💙";
  }
};
