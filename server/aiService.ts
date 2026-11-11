import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MEDIA_STORAGE_DIR } from './db.js';

function getAiClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

export function isApiKeyConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export interface PromptEnhancementResult {
  enhancedPrompt: string;
  negativePrompt: string;
  scenes: {
    sceneNumber: number;
    visualDescription: string;
    cameraAngle: string;
    lighting: string;
    dialogueOrVoiceover: string;
    durationSeconds: number;
  }[];
  soundEffects: string;
  recommendedAspect: string;
  recommendedStyle: string;
}

export async function enhanceScriptAndPrompt(params: {
  rawIdea: string;
  contentType: string; // 'video' | 'image' | 'voice' | 'social_reel'
  style?: string;
  targetAudience?: string;
  language?: string;
  customApiKey?: string;
}): Promise<PromptEnhancementResult> {
  const ai = getAiClient(params.customApiKey);
  if (!ai) {
    throw new Error('مفتاح Google Gemini API غير مهيأ في الخادم. يرجى ضبط GEMINI_API_KEY أو تزويد مفتاح BYOK.');
  }

  const systemInstruction = `أنت كبير كتاب السيناريو ومصممي البرومبتات في استوديو إنتاج سينمائي احترافي بالذكاء الاصطناعي (CREATIVE AI STUDIO PRO).
مهمتك تحويل فكرة المستخدم الخام إلى برومبت عالي الاحترافية، مع تقسيم مشاهد سينمائي، وتحديد زوايا الكاميرا، والإضاءة، ونصوص التعليق الصوتي المناسبة بالعربية والإنجليزية بدقة مذهلة.
يجب إرجاع النتيجة حصراً بصيغة JSON مطابقة للنموذج المطلوب دون أي نص توضيحي خارجي.`;

  const userPrompt = `حول هذه الفكرة إلى خطة توليد احترافية:
الفكرة: "${params.rawIdea}"
نوع المحتوى: "${params.contentType}"
الأسلوب: "${params.style || 'سينمائي واقعي احترافي'}"
الجمهور المستهدف: "${params.targetAudience || 'عام / صناع المحتوى ورواد الأعمال'}"
اللغة: "${params.language || 'العربية الفصحى المعاصرة'}"

أرجع JSON بالشكل التالي:
{
  "enhancedPrompt": "وصف دقيق باللغتين الإنجليزية والعربية يحتوي تفاصيل الإضاءة، العدسة، الجودة العالية، وأسلوب التكوين",
  "negativePrompt": "blurry, low quality, distorted anatomy, text artifacts, watermark",
  "scenes": [
    {
      "sceneNumber": 1,
      "visualDescription": "وصف المشهد البصري التفصيلي",
      "cameraAngle": "زاوية الكاميرا مثل Wide Shot / Close Up / Dolly In",
      "lighting": "نوع الإضاءة مثل Golden hour / Cinematic volumetric rim lighting",
      "dialogueOrVoiceover": "نص التعليق الصوتي الدقيق للمشهد",
      "durationSeconds": 5
    }
  ],
  "soundEffects": "المؤثرات الصوتية والموسيقى التصويرية الموصى بها",
  "recommendedAspect": "16:9",
  "recommendedStyle": "${params.style || 'Cinematic Photorealistic'}"
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json'
    }
  });

  const text = response.text || '{}';
  try {
    return JSON.parse(text) as PromptEnhancementResult;
  } catch (err) {
    return {
      enhancedPrompt: text,
      negativePrompt: 'low quality, blurry, distorted',
      scenes: [
        {
          sceneNumber: 1,
          visualDescription: params.rawIdea,
          cameraAngle: 'Cinematic Eye-level',
          lighting: 'Studio Soft Light',
          dialogueOrVoiceover: params.rawIdea,
          durationSeconds: 5
        }
      ],
      soundEffects: 'Ambient cinematic background',
      recommendedAspect: '16:9',
      recommendedStyle: params.style || 'Cinematic'
    };
  }
}

export async function generateImageContent(params: {
  prompt: string;
  model?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  imageSize?: '1K' | '2K' | '4K';
  arabicPosterText?: string;
  posterSubtitle?: string;
  customApiKey?: string;
}): Promise<{ mediaUrl: string; width: number; height: number; format: string }> {
  const ai = getAiClient(params.customApiKey);
  if (!ai) {
    throw new Error('مزود الصور غير مهيأ. يرجى توفير مفتاح Gemini API في إعدادات الخادم أو حسابك الشخصي.');
  }

  const selectedModel = params.model === 'gemini-nano-banana-2.1' 
    ? 'gemini-nano-banana-2.1' 
    : 'gemini-3.1-flash-lite-image';

  const aspect = params.aspectRatio || '1:1';

  const response = await ai.models.generateContent({
    model: selectedModel,
    contents: {
      parts: [
        {
          text: params.prompt
        }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: aspect
      }
    }
  });

  let base64Data: string | null = null;
  let mimeType = 'image/png';

  const candidate = response.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        base64Data = part.inlineData.data;
        if (part.inlineData.mimeType) {
          mimeType = part.inlineData.mimeType;
        }
        break;
      }
    }
  }

  if (!base64Data) {
    throw new Error('لم يتم استلام أي صورة من نموذج التوليد. تفاصيل الاستجابة: ' + (response.text || 'لا توجد بيانات'));
  }

  let finalBuffer = Buffer.from(base64Data, 'base64');

  // If poster text overlay requested, render professional typography overlay SVG
  if (params.arabicPosterText && params.arabicPosterText.trim()) {
    const title = params.arabicPosterText.trim();
    const subtitle = (params.posterSubtitle || '').trim();
    const base64ImageSrc = `data:${mimeType};base64,${base64Data}`;

    // Create an elegant SVG poster wrapping the AI image with Arabic typography overlay
    const svgPoster = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
      <defs>
        <linearGradient id="overlayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#020617" stop-opacity="0.2"/>
          <stop offset="60%" stop-color="#020617" stop-opacity="0.0"/>
          <stop offset="80%" stop-color="#020617" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#020617" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <!-- Base AI Generated Artwork -->
      <image href="${base64ImageSrc}" width="1080" height="1080" preserveAspectRatio="xMidYMid slice"/>
      <!-- Cinematic Shadow & Gradient Bar -->
      <rect x="0" y="0" width="1080" height="1080" fill="url(#overlayGrad)"/>
      <!-- Lower Banner Container -->
      <rect x="60" y="860" width="960" height="160" rx="20" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="2"/>
      <!-- Arabic Title -->
      <text x="980" y="930" text-anchor="end" font-family="'Cairo', sans-serif" font-weight="800" font-size="44" fill="#ffffff">${title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
      <!-- Subtitle -->
      ${subtitle ? `<text x="980" y="980" text-anchor="end" font-family="'Cairo', sans-serif" font-weight="500" font-size="26" fill="#38bdf8">${subtitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>` : ''}
    </svg>`;

    const fileName = `poster_${crypto.randomUUID()}.svg`;
    const filePath = path.join(MEDIA_STORAGE_DIR, fileName);
    fs.writeFileSync(filePath, svgPoster, 'utf-8');

    return {
      mediaUrl: `/api/media/${fileName}`,
      width: 1080,
      height: 1080,
      format: 'svg'
    };
  }

  const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
  const fileName = `img_${crypto.randomUUID()}.${ext}`;
  const filePath = path.join(MEDIA_STORAGE_DIR, fileName);
  fs.writeFileSync(filePath, finalBuffer);

  return {
    mediaUrl: `/api/media/${fileName}`,
    width: aspect === '16:9' ? 1280 : aspect === '9:16' ? 720 : 1024,
    height: aspect === '16:9' ? 720 : aspect === '9:16' ? 1280 : 1024,
    format: ext
  };
}

export async function generateSpeechContent(params: {
  text: string;
  voiceName?: string;
  style?: string;
  customApiKey?: string;
}): Promise<{ mediaUrl: string; durationEstimatedSeconds: number; format: string }> {
  const ai = getAiClient(params.customApiKey);
  if (!ai) {
    throw new Error('خدمة التعليق الصوتي غير مهيأة. يرجى توفير مفتاح Gemini API في إعدادات الخادم.');
  }

  // Prebuilt voice names: 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'
  const chosenVoice = params.voiceName || 'Kore';

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: params.text,
            speechMetadata: params.style ? { style: params.style } : undefined
          }
        ]
      }
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: chosenVoice }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('لم يتم إنشاء ملف صوتي بواسطة النموذج.');
  }

  const audioBuffer = Buffer.from(base64Audio, 'base64');
  const fileName = `voice_${crypto.randomUUID()}.wav`;
  const filePath = path.join(MEDIA_STORAGE_DIR, fileName);
  fs.writeFileSync(filePath, audioBuffer);

  // Approximate duration based on text length: ~130-150 words per minute
  const wordCount = params.text.trim().split(/\s+/).length;
  const estimatedDuration = Math.max(2, Math.round((wordCount / 2.5)));

  return {
    mediaUrl: `/api/media/${fileName}`,
    durationEstimatedSeconds: estimatedDuration,
    format: 'wav'
  };
}

export async function initiateVideoGeneration(params: {
  prompt: string;
  model?: string;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  durationSeconds?: number;
  imageBase64?: string;
  customApiKey?: string;
}): Promise<{ operationName: string }> {
  const ai = getAiClient(params.customApiKey);
  if (!ai) {
    throw new Error('خدمة الفيديو غير مهيأة. يتطلب إنشاء الفيديو مفتاح Google Gemini API مفعلاً.');
  }

  const model = params.model === 'veo-3.1-generate-preview' 
    ? 'veo-3.1-generate-preview' 
    : 'veo-3.1-lite-generate-preview';

  const configPayload: any = {
    numberOfVideos: 1,
    resolution: params.resolution || '720p',
    aspectRatio: params.aspectRatio || '16:9'
  };

  const videoParams: any = {
    model,
    prompt: params.prompt,
    config: configPayload
  };

  if (params.imageBase64) {
    videoParams.image = {
      imageBytes: params.imageBase64,
      mimeType: 'image/png'
    };
  }

  const operation = await ai.models.generateVideos(videoParams);

  if (!operation.name) {
    throw new Error('لم يرجع نموذج توليد الفيديو معرف العملية (Operation Name).');
  }

  return {
    operationName: operation.name
  };
}

export async function checkVideoOperationStatus(params: {
  operationName: string;
  customApiKey?: string;
}): Promise<{ done: boolean; downloadUri?: string; error?: string }> {
  const ai = getAiClient(params.customApiKey);
  if (!ai) throw new Error('مفتاح الذكاء الاصطناعي غير متوفر');

  const { GenerateVideosOperation } = await import('@google/genai');
  const op = new GenerateVideosOperation();
  op.name = params.operationName;

  const updated = await ai.operations.getVideosOperation({ operation: op });

  if (updated.error) {
    const errorMsg = String((updated.error as any).message || updated.error || 'فشلت عملية توليد الفيديو لدى المزود');
    return { done: true, error: errorMsg };
  }

  if (updated.done) {
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    return { done: true, downloadUri: uri };
  }

  return { done: false };
}

export async function downloadAndSaveVeoVideo(downloadUri: string, customApiKey?: string): Promise<string> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('API key missing for video download');

  const res = await fetch(downloadUri, {
    headers: { 'x-goog-api-key': apiKey }
  });

  if (!res.ok) {
    throw new Error(`فشل تنزيل ملف الفيديو من الخادم السحابي: ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = `video_${crypto.randomUUID()}.mp4`;
  const filePath = path.join(MEDIA_STORAGE_DIR, fileName);
  fs.writeFileSync(filePath, buffer);

  return `/api/media/${fileName}`;
}
