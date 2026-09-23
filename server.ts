import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Lazy initialize Gemini SDK client
  let aiClient: GoogleGenAI | null = null;
  function getAI(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    if (!aiClient) {
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // Health & capability check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Portrait generation with Imagen / Gemini Image API
  app.post('/api/generate-portrait', async (req, res) => {
    const {
      firstName,
      lastName,
      gender = 'M',
      birthDate,
      occupation,
      style = 'oil',
      customPrompt,
    } = req.body || {};

    // Era estimation based on birth year
    let eraDesc = 'timeless vintage era';
    if (birthDate && typeof birthDate === 'string') {
      const year = parseInt(birthDate.slice(0, 4), 10);
      if (!isNaN(year)) {
        if (year < 1880) eraDesc = 'mid-19th century Victorian era (circa 1860s)';
        else if (year < 1900) eraDesc = 'late 19th century Belle Époque era (circa 1890s)';
        else if (year < 1920) eraDesc = 'early 20th century era (circa 1910s)';
        else if (year < 1940) eraDesc = 'interwar 1920s-1930s vintage era';
        else if (year < 1960) eraDesc = 'mid-20th century vintage 1940s-1950s era';
        else eraDesc = 'contemporary classic archive portrait';
      }
    }

    // Determine artistic style nuances
    let styleDetails = '';
    switch (style) {
      case 'sepia':
        styleDetails =
          'Authentic archival vintage sepia daguerreotype photograph, antique silver gelatin tint, fine natural film grain, soft warm sepia tones, classic photographic studio portrait';
        break;
      case 'watercolor':
        styleDetails =
          'Artistic watercolor and fine ink wash illustration, soft glowing earth tones, delicate linework, paper texture, poetic family chronicle artwork';
        break;
      case 'sketch':
        styleDetails =
          'Charcoal and sepia pencil genealogical portrait sketch, textured antique parchment paper background, refined cross-hatching, master draftsmanship';
        break;
      case 'oil':
      default:
        styleDetails =
          'Classical European museum oil painting, rich textured impasto brushstrokes, warm chiaroscuro lighting, dark velvety background, heirloom family portrait';
        break;
    }

    const person =
      gender === 'F'
        ? 'dignified French woman'
        : gender === 'M'
        ? 'dignified French gentleman'
        : 'dignified person';
    const nameDesc = firstName || lastName ? `named ${firstName || ''} ${lastName || ''}`.trim() : '';
    const occDesc = occupation
      ? `wearing subtle attire fitting their profession as a ${occupation}`
      : 'wearing refined historical clothing';

    const fullPrompt =
      customPrompt && typeof customPrompt === 'string' && customPrompt.trim().length > 0
        ? customPrompt.trim()
        : `A masterpiece 1:1 bust portrait of a ${person} ${nameDesc}, ${eraDesc}, ${occDesc}. Style: ${styleDetails}. Centered, facing camera, high aesthetic fidelity, beautiful lighting, respectful family tree archive illustration.`;

    const ai = getAI();
    if (!ai) {
      return res.status(200).json({
        success: false,
        reason: 'missing_key',
        message: 'Clé API Gemini non configurée dans l’environnement.',
        prompt: fullPrompt,
      });
    }

    try {
      // Call modern Gemini image generation model
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1',
          },
        },
      });

      let imageUrl: string | null = null;
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        return res.json({
          success: true,
          imageUrl,
          prompt: fullPrompt,
        });
      }

      return res.status(200).json({
        success: false,
        reason: 'no_image_part',
        message: 'Aucune donnée d’image générée par le modèle.',
        prompt: fullPrompt,
      });
    } catch (apiError: any) {
      console.warn('Imagen / Gemini portrait generation warning:', apiError?.message || apiError);
      const isQuota =
        apiError?.message?.includes('429') ||
        apiError?.message?.includes('RESOURCE_EXHAUSTED') ||
        apiError?.message?.includes('quota');

      return res.status(200).json({
        success: false,
        reason: isQuota ? 'quota_exceeded' : 'api_error',
        message: isQuota
          ? 'Quota Imagen/Gemini atteint ou modèle nécessitant une clé payante active.'
          : apiError?.message || 'Erreur lors de la génération avec l’IA.',
        prompt: fullPrompt,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
