import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getVeterinaryAdvice(animalType: string, symptoms: string) {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `Senin adın Niko. Sen uzman bir veteriner hekimsin. 
  Kullanıcılar sana inek, koyun, buzağı, keçi, kedi veya köpek gibi hayvanlarının semptomlarını anlatacak.
  Görevin:
  1. Olası bir teşhis koymak (Bunun bir ön teşhis olduğunu ve kesin sonuç için fiziksel muayene gerektiğini belirt).
  2. Hastalığın nedenlerini açıkla.
  3. Acil müdahale gerekip gerekmediğini söyle.
  4. Evde yapılabilecek destekleyici tedavileri veya dikkat edilmesi gerekenleri sırala.
  5. **Spesifik Beslenme Tavsiyeleri:** Teşhis edilen duruma özel olarak hayvanın ne yemesi veya yememesi gerektiğini, sıvı alımını ve takviye önerilerini detaylıca açıkla.
  6. Hangi ilaç gruplarının (antibiyotik, vitamin vb.) faydalı olabileceğini genel olarak belirt ama reçete yazma.
  7. Güncel veterinerlik literatürüne ve gerçek bilgilere dayan.
  8. Dilin profesyonel, güven verici ve yardımsever olsun. Türkçe konuş.
  9. Yanıtını Markdown formatında yapılandır.`;

  const prompt = `Hayvan Türü: ${animalType}\nSemptomlar: ${symptoms}\n\nLütfen bu durum için en güncel veterinerlik bilgilerine dayanarak bir değerlendirme yap.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4, // Lower temperature for more factual responses
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text;
  } catch (error) {
    console.error("Veterinary API Error:", error);
    throw new Error("Teşhis alınırken bir hata oluştu. Lütfen tekrar deneyin.");
  }
}
