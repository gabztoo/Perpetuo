# 📝 Perpetuo Multimodal Implementation Guide
**Complete Technical Specification for Images, Audio, Video, PDFs, and Image Generation**

**Date:** January 28, 2026  
**Status:** Ready for Development  
**Estimated Effort:** 14 days (P1)

---

## Table of Contents

1. [Database Schema Updates](#database-schema-updates)
2. [Type Definitions](#type-definitions)
3. [Image Input Implementation](#image-input-implementation)
4. [Audio Input Implementation](#audio-input-implementation)
5. [Video Input Implementation](#video-input-implementation)
6. [PDF Input Implementation](#pdf-input-implementation)
7. [Image Generation Implementation](#image-generation-implementation)
8. [Provider Capability Detection](#provider-capability-detection)
9. [Testing Strategy](#testing-strategy)

---

## Database Schema Updates

### 1. Extended Provider Capabilities

```prisma
// Update prisma/schema.prisma

model Provider {
  id            String   @id @default(cuid())
  workspace_id  String
  workspace     Workspace @relation(fields: [workspace_id], references: [id])
  
  provider_name String   // "openai", "anthropic", "google", etc.
  api_key_encrypted String
  priority      Int      @default(1)
  enabled       Boolean  @default(true)
  
  // NEW: Multimodal capabilities
  supports_image_input          Boolean @default(false)
  supports_audio_input          Boolean @default(false)
  supports_video_input          Boolean @default(false)
  supports_pdf_input            Boolean @default(false)
  supports_image_generation     Boolean @default(false)
  
  // NEW: Model-specific capabilities (JSON for flexibility)
  models_with_vision            String[] @default([])  // ["gpt-4-vision", "gpt-4-turbo"]
  models_with_audio             String[] @default([])
  models_with_video             String[] @default([])
  models_with_pdf               String[] @default([])
  models_with_image_gen         String[] @default([])
  
  // NEW: Provider-specific constraints
  max_image_size_mb             Int?     // Maximum image size in MB
  supported_image_formats       String[] @default(["jpeg", "png", "webp", "gif"])
  supported_audio_formats       String[] @default([])
  supported_video_formats       String[] @default(["mp4", "mov", "webm"])
  max_video_duration_seconds    Int?     // Maximum video length
  
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  
  @@index([workspace_id])
}

// NEW: Request Log Extended for Multimodal
model RequestLog {
  id                    String   @id @default(cuid())
  workspace_id          String
  workspace             Workspace @relation(fields: [workspace_id], references: [id])
  
  request_id            String   @unique
  api_key_id            String
  api_key               APIKey   @relation(fields: [api_key_id], references: [id])
  
  model                 String   // gpt-4, claude-opus, etc.
  provider_used         String   // Which provider actually handled it
  strategy              String   @default("default")
  
  // NEW: Multimodal tracking
  has_images            Boolean  @default(false)
  image_count           Int      @default(0)
  has_audio             Boolean  @default(false)
  has_video             Boolean  @default(false)
  has_pdf               Boolean  @default(false)
  is_image_generation   Boolean  @default(false)
  
  // NEW: File processing
  pdf_processing_engine String?  // "pdf-text", "mistral-ocr", "native"
  file_annotations_cached Boolean @default(false)
  
  // Standard tracking
  input_tokens          Int
  output_tokens         Int
  total_tokens          Int
  latency_ms            Int
  status_code           Int
  
  created_at            DateTime @default(now())
  @@index([workspace_id])
  @@index([created_at])
}

// NEW: File Processing Cache
model FileAnnotationCache {
  id          String   @id @default(cuid())
  workspace_id String
  workspace   Workspace @relation(fields: [workspace_id], references: [id])
  
  file_hash   String   @unique  // SHA-256 of file content
  file_name   String
  file_size   Int
  file_type   String   // "pdf", "image", "audio", "video"
  
  // Cached annotation (avoids re-parsing)
  annotation_json String  // Serialized file annotation
  
  // For PDFs: cached parsing results
  pdf_engine  String?  // Which engine was used
  parsed_text String?  // Extracted text
  page_count  Int?
  
  created_at  DateTime @default(now())
  expires_at  DateTime // Auto-cleanup after 30 days
  
  @@index([workspace_id])
  @@index([expires_at])
}
```

### 2. Migration File

```sql
-- migrations/002_add_multimodal_support.sql

-- Add columns to Provider table
ALTER TABLE "Provider" ADD COLUMN "supports_image_input" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Provider" ADD COLUMN "supports_audio_input" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Provider" ADD COLUMN "supports_video_input" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Provider" ADD COLUMN "supports_pdf_input" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Provider" ADD COLUMN "supports_image_generation" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Provider" ADD COLUMN "models_with_vision" TEXT[] DEFAULT '{}';
ALTER TABLE "Provider" ADD COLUMN "models_with_audio" TEXT[] DEFAULT '{}';
ALTER TABLE "Provider" ADD COLUMN "models_with_video" TEXT[] DEFAULT '{}';
ALTER TABLE "Provider" ADD COLUMN "models_with_pdf" TEXT[] DEFAULT '{}';
ALTER TABLE "Provider" ADD COLUMN "models_with_image_gen" TEXT[] DEFAULT '{}';

ALTER TABLE "Provider" ADD COLUMN "max_image_size_mb" INTEGER;
ALTER TABLE "Provider" ADD COLUMN "supported_image_formats" TEXT[] DEFAULT '{"jpeg","png","webp","gif"}';
ALTER TABLE "Provider" ADD COLUMN "supported_audio_formats" TEXT[] DEFAULT '{}';
ALTER TABLE "Provider" ADD COLUMN "supported_video_formats" TEXT[] DEFAULT '{"mp4","mov","webm"}';
ALTER TABLE "Provider" ADD COLUMN "max_video_duration_seconds" INTEGER;

-- Add columns to RequestLog table
ALTER TABLE "RequestLog" ADD COLUMN "has_images" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RequestLog" ADD COLUMN "image_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RequestLog" ADD COLUMN "has_audio" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RequestLog" ADD COLUMN "has_video" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RequestLog" ADD COLUMN "has_pdf" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RequestLog" ADD COLUMN "is_image_generation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RequestLog" ADD COLUMN "pdf_processing_engine" VARCHAR;
ALTER TABLE "RequestLog" ADD COLUMN "file_annotations_cached" BOOLEAN NOT NULL DEFAULT false;

-- Create FileAnnotationCache table
CREATE TABLE "FileAnnotationCache" (
  id VARCHAR PRIMARY KEY,
  workspace_id VARCHAR NOT NULL,
  file_hash VARCHAR NOT NULL UNIQUE,
  file_name VARCHAR NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR NOT NULL,
  annotation_json TEXT NOT NULL,
  pdf_engine VARCHAR,
  parsed_text TEXT,
  page_count INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX "FileAnnotationCache_workspace_id_idx" ON "FileAnnotationCache"("workspace_id");
CREATE INDEX "FileAnnotationCache_expires_at_idx" ON "FileAnnotationCache"("expires_at");
```

---

## Type Definitions

### Multimodal Content Types

```typescript
// apps/perpetuo-backend/src/shared/types.ts

// Image Content
export interface ImageURLContent {
  type: 'image_url';
  image_url: {
    url: string;  // Can be HTTPS URL or data:image/... base64
  };
}

// Audio Content
export interface InputAudioContent {
  type: 'input_audio';
  input_audio: {
    data: string;  // base64 encoded
    format: 'wav' | 'mp3' | 'aiff' | 'aac' | 'ogg' | 'flac' | 'm4a' | 'pcm16';
  };
}

// Video Content
export interface VideoURLContent {
  type: 'video_url';
  video_url: {
    url: string;  // YouTube URL or data:video/... base64
  };
}

// PDF/File Content
export interface FileContent {
  type: 'file';
  file: {
    filename: string;
    file_data: string;  // URL or data:application/pdf;base64,...
  };
}

// File Annotation (returned from API)
export interface FileAnnotation {
  type: 'file';
  file: {
    hash: string;  // Unique identifier (re-use to skip parsing)
    name?: string;
    content: ContentPart[];  // Parsed text + images from PDF
  };
}

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

// Extended Message Content
export type MessageContent =
  | string  // Backward compatible
  | (
      | { type: 'text'; text: string }
      | ImageURLContent
      | InputAudioContent
      | VideoURLContent
      | FileContent
    )[];

// Extended Chat Request
export interface ChatCompletionRequest {
  model: string;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: MessageContent;
    annotations?: FileAnnotation[];  // For PDF reuse
  }[];
  
  // NEW: Multimodal parameters
  modalities?: ('text' | 'image' | 'audio' | 'video')[];
  image_config?: {
    aspect_ratio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
    image_size?: '1K' | '2K' | '4K';  // Gemini only
  };
  
  // PDF processing configuration
  plugins?: {
    id: 'file-parser';
    pdf?: {
      engine: 'native' | 'pdf-text' | 'mistral-ocr' | 'simple-text-extraction';
    };
  }[];
  
  // Standard parameters
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Extended Chat Response
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  provider: string;
  choices: {
    message: {
      role: 'assistant';
      content: string;
      images?: {
        type: 'image_url';
        image_url: { url: string };
      }[];
      annotations?: FileAnnotation[];  // PDF parsing results
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

---

## Image Input Implementation

### Validation and Routing

```typescript
// apps/perpetuo-backend/src/modules/gateway/multimodal/imageProcessor.ts

import { createHash } from 'crypto';

export class ImageProcessor {
  private readonly MAX_IMAGE_SIZE_MB = 20;
  private readonly SUPPORTED_FORMATS = ['jpeg', 'png', 'webp', 'gif'];

  /**
   * Validate image input and detect format
   */
  validateImage(imageUrl: string): {
    valid: boolean;
    format?: 'jpeg' | 'png' | 'webp' | 'gif';
    isBase64?: boolean;
    error?: string;
  } {
    // Check if base64 or URL
    if (imageUrl.startsWith('data:')) {
      return this.validateBase64Image(imageUrl);
    }
    if (imageUrl.startsWith('http')) {
      return this.validateImageUrl(imageUrl);
    }
    return { valid: false, error: 'Image must be URL or base64 data URL' };
  }

  private validateBase64Image(dataUrl: string): {
    valid: boolean;
    format?: 'jpeg' | 'png' | 'webp' | 'gif';
    isBase64: boolean;
    error?: string;
  } {
    try {
      const match = dataUrl.match(/^data:image\/([\w]+);base64,(.+)$/);
      if (!match) {
        return {
          valid: false,
          isBase64: true,
          error: 'Invalid base64 data URL format'
        };
      }

      const format = match[1] as 'jpeg' | 'png' | 'webp' | 'gif';
      const base64Data = match[2];

      // Estimate size from base64 (rough estimate: ~4/3 ratio)
      const sizeEstimate = (base64Data.length * 3) / 4 / 1024 / 1024;
      if (sizeEstimate > this.MAX_IMAGE_SIZE_MB) {
        return {
          valid: false,
          isBase64: true,
          format,
          error: `Image too large: ${sizeEstimate.toFixed(1)}MB > ${this.MAX_IMAGE_SIZE_MB}MB`
        };
      }

      if (!this.SUPPORTED_FORMATS.includes(format)) {
        return {
          valid: false,
          isBase64: true,
          format,
          error: `Unsupported format: ${format}. Supported: ${this.SUPPORTED_FORMATS.join(', ')}`
        };
      }

      return { valid: true, isBase64: true, format };
    } catch (error) {
      return {
        valid: false,
        isBase64: true,
        error: `Failed to validate base64 image: ${error.message}`
      };
    }
  }

  private validateImageUrl(url: string): {
    valid: boolean;
    format?: 'jpeg' | 'png' | 'webp' | 'gif';
    isBase64: boolean;
    error?: string;
  } {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          valid: false,
          isBase64: false,
          error: 'Image URL must use HTTP or HTTPS'
        };
      }
      // Format detection from file extension
      const path = urlObj.pathname.toLowerCase();
      const format =
        (path.endsWith('.jpg') || path.endsWith('.jpeg')
          ? 'jpeg'
          : path.endsWith('.png')
            ? 'png'
            : path.endsWith('.webp')
              ? 'webp'
              : path.endsWith('.gif')
                ? 'gif'
                : null) as 'jpeg' | 'png' | 'webp' | 'gif' | null;

      if (!format) {
        return {
          valid: false,
          isBase64: false,
          error: 'Could not determine image format from URL'
        };
      }

      return { valid: true, isBase64: false, format };
    } catch (error) {
      return {
        valid: false,
        isBase64: false,
        error: `Invalid image URL: ${error.message}`
      };
    }
  }

  /**
   * Select providers that support images for the given model
   */
  async selectImageCapableProviders(
    workspace,
    model: string
  ): Promise<Provider[]> {
    const providers = await workspace.providers.findMany({
      where: { enabled: true, supports_image_input: true }
    });

    // Filter to providers that support this specific model with vision
    return providers.filter(
      p => p.models_with_vision.includes(model)
    );
  }
}
```

### Usage in Chat Route

```typescript
// apps/perpetuo-backend/src/modules/gateway/routes.ts (excerpt)

import { ImageProcessor } from './multimodal/imageProcessor';

const imageProcessor = new ImageProcessor();

app.post('/v1/chat/completions', async (request, reply) => {
  // ... existing auth and validation ...

  const { model, messages, modalities } = request.body;

  // NEW: Check for multimodal content
  let hasImages = false;
  let imageCount = 0;

  for (const message of messages) {
    if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === 'image_url') {
          const validation = imageProcessor.validateImage(
            content.image_url.url
          );
          if (!validation.valid) {
            return reply.status(400).send({
              error: { message: validation.error }
            });
          }
          hasImages = true;
          imageCount++;
        }
      }
    }
  }

  // If request has images, filter providers
  let availableProviders = workspace.providers;
  if (hasImages) {
    availableProviders = await imageProcessor.selectImageCapableProviders(
      workspace,
      model
    );
    if (availableProviders.length === 0) {
      return reply.status(400).send({
        error: {
          message: `Model ${model} with image support not available for this workspace`
        }
      });
    }
  }

  // ... rest of routing logic ...
  
  // Log multimodal usage
  await db.requestLog.create({
    data: {
      workspace_id: workspace.id,
      has_images: hasImages,
      image_count: imageCount,
      // ... other fields ...
    }
  });
});
```

---

## Audio Input Implementation

### Audio Processing

```typescript
// apps/perpetuo-backend/src/modules/gateway/multimodal/audioProcessor.ts

export class AudioProcessor {
  private readonly MAX_AUDIO_SIZE_MB = 50;
  private readonly SUPPORTED_FORMATS = [
    'wav', 'mp3', 'aiff', 'aac', 'ogg', 'flac', 'm4a', 'pcm16', 'pcm24'
  ];

  validateAudio(audioData: string, format: string): {
    valid: boolean;
    error?: string;
    sizeEstimate?: number;
  } {
    // Validate format
    if (!this.SUPPORTED_FORMATS.includes(format)) {
      return {
        valid: false,
        error: `Unsupported audio format: ${format}. Supported: ${this.SUPPORTED_FORMATS.join(', ')}`
      };
    }

    // Validate base64
    try {
      Buffer.from(audioData, 'base64');
    } catch (error) {
      return { valid: false, error: 'Invalid base64 audio data' };
    }

    // Estimate size
    const sizeEstimate = (audioData.length * 3) / 4 / 1024 / 1024;
    if (sizeEstimate > this.MAX_AUDIO_SIZE_MB) {
      return {
        valid: false,
        error: `Audio file too large: ${sizeEstimate.toFixed(1)}MB > ${this.MAX_AUDIO_SIZE_MB}MB`
      };
    }

    return { valid: true, sizeEstimate };
  }

  /**
   * Get providers that support audio input for this model
   */
  async selectAudioCapableProviders(
    workspace,
    model: string
  ): Promise<Provider[]> {
    const providers = await workspace.providers.findMany({
      where: { enabled: true, supports_audio_input: true }
    });

    return providers.filter(p => p.models_with_audio.includes(model));
  }
}
```

---

## Video Input Implementation

### Video Processing with Provider-Specific Logic

```typescript
// apps/perpetuo-backend/src/modules/gateway/multimodal/videoProcessor.ts

export class VideoProcessor {
  private readonly SUPPORTED_FORMATS = ['mp4', 'mpeg', 'mov', 'webm'];

  validateVideo(videoUrl: string): {
    valid: boolean;
    format?: string;
    isBase64?: boolean;
    isYouTube?: boolean;
    error?: string;
  } {
    // Check for YouTube URL
    if (this.isYouTubeUrl(videoUrl)) {
      return { valid: true, isYouTube: true };
    }

    // Check for base64 data URL
    if (videoUrl.startsWith('data:')) {
      return this.validateBase64Video(videoUrl);
    }

    // Check for HTTP URL
    if (videoUrl.startsWith('http')) {
      return this.validateVideoUrl(videoUrl);
    }

    return { valid: false, error: 'Video must be YouTube URL or base64 data URL' };
  }

  private isYouTubeUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname.includes('youtube.com') ||
        urlObj.hostname.includes('youtu.be')
      );
    } catch {
      return false;
    }
  }

  private validateBase64Video(dataUrl: string): {
    valid: boolean;
    format?: string;
    isBase64: boolean;
    error?: string;
  } {
    try {
      const match = dataUrl.match(/^data:video\/([\w]+);base64,(.+)$/);
      if (!match) {
        return {
          valid: false,
          isBase64: true,
          error: 'Invalid base64 data URL format'
        };
      }

      const format = match[1];
      if (!this.SUPPORTED_FORMATS.includes(format)) {
        return {
          valid: false,
          isBase64: true,
          format,
          error: `Unsupported format: ${format}. Supported: ${this.SUPPORTED_FORMATS.join(', ')}`
        };
      }

      return { valid: true, isBase64: true, format };
    } catch (error) {
      return {
        valid: false,
        isBase64: true,
        error: `Failed to validate base64 video: ${error.message}`
      };
    }
  }

  private validateVideoUrl(url: string): {
    valid: boolean;
    format?: string;
    isBase64: boolean;
    error?: string;
  } {
    try {
      new URL(url); // Validate URL format
      return { valid: true, isBase64: false };
    } catch (error) {
      return {
        valid: false,
        isBase64: false,
        error: `Invalid video URL: ${error.message}`
      };
    }
  }

  /**
   * Route video request to appropriate provider
   * Gemini AI Studio: Only YouTube URLs
   * Gemini Vertex: Use base64 data URLs
   */
  async routeVideoRequest(
    workspace,
    model: string,
    videoUrl: string
  ): Promise<Provider> {
    const providers = await workspace.providers.findMany({
      where: { enabled: true, supports_video_input: true }
    });

    const videoProviders = providers.filter(
      p => p.models_with_video.includes(model)
    );

    if (videoProviders.length === 0) {
      throw new Error(`No video-capable providers for model ${model}`);
    }

    // Provider-specific routing
    if (this.isYouTubeUrl(videoUrl)) {
      // Prefer Gemini AI Studio (supports YouTube)
      const geminaiStudio = videoProviders.find(p =>
        p.provider_name === 'google' && p.supports_video_input
      );
      if (geminaiStudio) return geminaiStudio;
    }

    // For base64 or non-YouTube URLs, use any video-capable provider
    return videoProviders[0];
  }
}
```

---

## PDF Input Implementation

### PDF Processing with Caching

```typescript
// apps/perpetuo-backend/src/modules/gateway/multimodal/pdfProcessor.ts

import { createHash } from 'crypto';

export class PDFProcessor {
  private readonly db = db;
  private readonly SUPPORTED_ENGINES = [
    'native',
    'pdf-text',
    'mistral-ocr',
    'simple-text-extraction'
  ];

  /**
   * Process PDF and cache annotations to avoid re-parsing
   */
  async processPDF(
    workspace,
    fileData: string,
    filename: string,
    engine: string
  ): Promise<{
    annotations: FileAnnotation;
    cached: boolean;
  }> {
    // Validate engine
    if (!this.SUPPORTED_ENGINES.includes(engine)) {
      throw new Error(
        `Unsupported PDF engine: ${engine}. Supported: ${this.SUPPORTED_ENGINES.join(', ')}`
      );
    }

    // Compute file hash
    const fileHash = createHash('sha256')
      .update(fileData)
      .digest('hex');

    // Check cache
    const cached = await this.db.fileAnnotationCache.findUnique({
      where: { file_hash: fileHash }
    });

    if (cached) {
      return {
        annotations: JSON.parse(cached.annotation_json),
        cached: true
      };
    }

    // Parse PDF
    const annotations = await this.parsePDF(
      fileData,
      filename,
      engine
    );

    // Cache annotations
    await this.db.fileAnnotationCache.create({
      data: {
        workspace_id: workspace.id,
        file_hash: fileHash,
        file_name: filename,
        file_size: Buffer.byteLength(fileData, 'base64'),
        file_type: 'pdf',
        annotation_json: JSON.stringify(annotations),
        pdf_engine: engine,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    return { annotations, cached: false };
  }

  private async parsePDF(
    fileData: string,
    filename: string,
    engine: string
  ): Promise<FileAnnotation> {
    switch (engine) {
      case 'native':
        // Pass directly to model (model handles parsing)
        return this.nativeParsing(fileData, filename);

      case 'pdf-text':
        // Simple text extraction
        return this.textExtraction(fileData, filename);

      case 'mistral-ocr':
        // Call Mistral OCR service
        return this.mistralOCR(fileData, filename);

      case 'simple-text-extraction':
        // Lightweight text extraction
        return this.simpleExtraction(fileData, filename);

      default:
        throw new Error(`Unknown PDF engine: ${engine}`);
    }
  }

  private nativeParsing(
    fileData: string,
    filename: string
  ): FileAnnotation {
    // Model will handle parsing natively
    return {
      type: 'file',
      file: {
        hash: createHash('sha256').update(fileData).digest('hex'),
        name: filename,
        content: [
          {
            type: 'text',
            text: '[PDF content will be parsed by the model]'
          }
        ]
      }
    };
  }

  private textExtraction(
    fileData: string,
    filename: string
  ): FileAnnotation {
    // Placeholder: Real implementation would use PDF parsing library
    // e.g., pdfjs-dist, pdf-parse, etc.
    return {
      type: 'file',
      file: {
        hash: createHash('sha256').update(fileData).digest('hex'),
        name: filename,
        content: [
          {
            type: 'text',
            text: 'Extracted PDF text would go here...'
          }
        ]
      }
    };
  }

  private async mistralOCR(
    fileData: string,
    filename: string
  ): Promise<FileAnnotation> {
    // Call Mistral API for OCR processing
    // Cost: $2 per 1,000 pages
    const response = await fetch(
      'https://api.mistral.ai/v1/document/parse',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`
        },
        body: fileData
      }
    );

    const result = await response.json();
    return {
      type: 'file',
      file: {
        hash: createHash('sha256').update(fileData).digest('hex'),
        name: filename,
        content: result.content // Mistral returns parsed content
      }
    };
  }

  private simpleExtraction(
    fileData: string,
    filename: string
  ): FileAnnotation {
    // Ultra-lightweight extraction for simple PDFs
    return {
      type: 'file',
      file: {
        hash: createHash('sha256').update(fileData).digest('hex'),
        name: filename,
        content: [
          {
            type: 'text',
            text: 'Simple extracted text...'
          }
        ]
      }
    };
  }

  /**
   * Detect if request has PDFs
   */
  detectPDFsInMessages(messages: any[]): boolean {
    for (const message of messages) {
      if (Array.isArray(message.content)) {
        for (const content of message.content) {
          if (content.type === 'file' && 
              content.file.filename.endsWith('.pdf')) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
```

---

## Image Generation Implementation

### Image Generation Handler

```typescript
// apps/perpetuo-backend/src/modules/gateway/multimodal/imageGenerator.ts

export class ImageGenerator {
  /**
   * Detect if request is for image generation
   */
  isImageGenerationRequest(request: ChatCompletionRequest): boolean {
    const { modalities } = request;
    if (!modalities) return false;

    return modalities.includes('image') &&
      !this.hasImageInputContent(request.messages);
  }

  private hasImageInputContent(messages: any[]): boolean {
    for (const message of messages) {
      if (Array.isArray(message.content)) {
        if (message.content.some(c => c.type === 'image_url')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Select image generation capable providers
   */
  async selectImageGenerationProviders(
    workspace,
    model: string
  ): Promise<Provider[]> {
    const providers = await workspace.providers.findMany({
      where: {
        enabled: true,
        supports_image_generation: true
      }
    });

    return providers.filter(
      p => p.models_with_image_gen.includes(model)
    );
  }

  /**
   * Validate image generation parameters
   */
  validateImageConfig(imageConfig?: any): {
    valid: boolean;
    error?: string;
  } {
    if (!imageConfig) return { valid: true };

    const validAspectRatios = [
      '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'
    ];

    if (imageConfig.aspect_ratio &&
        !validAspectRatios.includes(imageConfig.aspect_ratio)) {
      return {
        valid: false,
        error: `Invalid aspect ratio: ${imageConfig.aspect_ratio}`
      };
    }

    const validSizes = ['1K', '2K', '4K'];
    if (imageConfig.image_size &&
        !validSizes.includes(imageConfig.image_size)) {
      return {
        valid: false,
        error: `Invalid image size: ${imageConfig.image_size}`
      };
    }

    return { valid: true };
  }

  /**
   * Format response with generated images
   */
  formatImageGenerationResponse(response: any): ChatCompletionResponse {
    return {
      ...response,
      choices: response.choices.map(choice => ({
        ...choice,
        message: {
          ...choice.message,
          images: choice.message.images || []
        }
      }))
    };
  }
}
```

---

## Provider Capability Detection

### Automatic Provider Capability Registration

```typescript
// apps/perpetuo-backend/src/modules/gateway/multimodal/providerCapabilities.ts

export const PROVIDER_CAPABILITIES = {
  openai: {
    supports_image_input: true,
    models_with_vision: ['gpt-4-vision', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
    supports_audio_input: true,
    models_with_audio: ['gpt-4-turbo', 'gpt-4o'],
    supports_video_input: false,
    supports_pdf_input: true,
    supports_image_generation: true,
    models_with_image_gen: ['dall-e-3'],
    supported_image_formats: ['jpeg', 'png', 'webp', 'gif'],
    max_image_size_mb: 20
  },

  anthropic: {
    supports_image_input: true,
    models_with_vision: ['claude-opus', 'claude-sonnet', 'claude-haiku'],
    supports_audio_input: false,
    models_with_audio: [],
    supports_video_input: false,
    supports_pdf_input: true,
    supports_image_generation: false,
    models_with_image_gen: [],
    supported_image_formats: ['jpeg', 'png', 'webp', 'gif'],
    max_image_size_mb: 20
  },

  google: {
    supports_image_input: true,
    models_with_vision: ['gemini-2.5-flash', 'gemini-3-pro', 'gemini-3-flash'],
    supports_audio_input: true,
    models_with_audio: ['gemini-2.5-flash', 'gemini-3-pro'],
    supports_video_input: true,
    models_with_video: ['gemini-2.5-flash', 'gemini-3-pro'],
    supports_pdf_input: true,
    supports_image_generation: true,
    models_with_image_gen: ['gemini-2.5-flash-image-preview', 'gemini-3-pro-image-preview'],
    supported_image_formats: ['jpeg', 'png', 'webp', 'gif'],
    max_image_size_mb: 32,
    supported_video_formats: ['mp4', 'mpeg', 'mov', 'webm'],
    max_video_duration_seconds: 3600
  },

  groq: {
    supports_image_input: true,
    models_with_vision: ['mixtral-8x7b', 'llama-3-vision'],
    supports_audio_input: false,
    supports_video_input: false,
    supports_pdf_input: false,
    supports_image_generation: false,
    supported_image_formats: ['jpeg', 'png']
  },

  cohere: {
    supports_image_input: false,
    supports_audio_input: false,
    supports_video_input: false,
    supports_pdf_input: false,
    supports_image_generation: true,
    models_with_image_gen: ['command-r']
  }
};

/**
 * Register provider capabilities on startup
 */
export async function registerProviderCapabilities(db, workspace) {
  for (const [providerName, capabilities] of Object.entries(
    PROVIDER_CAPABILITIES
  )) {
    await db.provider.updateMany({
      where: {
        workspace_id: workspace.id,
        provider_name: providerName
      },
      data: capabilities
    });
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// apps/perpetuo-backend/src/modules/gateway/multimodal/__tests__/imageProcessor.test.ts

import { ImageProcessor } from '../imageProcessor';

describe('ImageProcessor', () => {
  let processor: ImageProcessor;

  beforeEach(() => {
    processor = new ImageProcessor();
  });

  describe('validateImage', () => {
    it('should validate HTTPS image URLs', () => {
      const url = 'https://example.com/image.jpg';
      const result = processor.validateImage(url);
      expect(result.valid).toBe(true);
      expect(result.format).toBe('jpeg');
      expect(result.isBase64).toBe(false);
    });

    it('should validate base64 data URLs', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const result = processor.validateImage(dataUrl);
      expect(result.valid).toBe(true);
      expect(result.format).toBe('png');
      expect(result.isBase64).toBe(true);
    });

    it('should reject invalid formats', () => {
      const url = 'https://example.com/image.bmp';
      const result = processor.validateImage(url);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Could not determine image format');
    });

    it('should reject oversized images', () => {
      const largeBase64 = 'data:image/png;base64,' + 'A'.repeat(100_000_000); // ~100MB
      const result = processor.validateImage(largeBase64);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });
  });
});
```

### Integration Tests

```typescript
// apps/perpetuo-backend/src/modules/gateway/__tests__/multimodal.integration.test.ts

describe('Multimodal Chat Completions', () => {
  it('should process image input in messages', async () => {
    const response = await api.post('/v1/chat/completions', {
      model: 'gpt-4-vision',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: "What's in this image?" },
            {
              type: 'image_url',
              image_url: {
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg'
              }
            }
          ]
        }
      ]
    });

    expect(response.status).toBe(200);
    expect(response.body.choices[0].message.content).toBeDefined();
  });

  it('should reject requests without vision-capable providers', async () => {
    const workspace = await setupWorkspaceWithoutVision();

    const response = await api.post('/v1/chat/completions', {
      model: 'gpt-4-vision',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: 'https://example.com/image.jpg' }
            }
          ]
        }
      ]
    });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('image support not available');
  });

  it('should generate images with aspect ratio control', async () => {
    const response = await api.post('/v1/chat/completions', {
      model: 'dall-e-3',
      messages: [
        {
          role: 'user',
          content: 'Generate a sunset'
        }
      ],
      modalities: ['image', 'text'],
      image_config: { aspect_ratio: '16:9' }
    });

    expect(response.status).toBe(200);
    expect(response.body.choices[0].message.images).toBeDefined();
    expect(response.body.choices[0].message.images.length).toBeGreaterThan(0);
  });

  it('should cache PDF annotations', async () => {
    const pdfUrl = 'https://bitcoin.org/bitcoin.pdf';

    // First request: parses PDF
    const response1 = await api.post('/v1/chat/completions', {
      model: 'claude-opus',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Summarize this PDF' },
            {
              type: 'file',
              file: {
                filename: 'bitcoin.pdf',
                file_data: pdfUrl
              }
            }
          ]
        }
      ],
      plugins: [
        {
          id: 'file-parser',
          pdf: { engine: 'pdf-text' }
        }
      ]
    });

    expect(response1.status).toBe(200);
    expect(response1.body.choices[0].message.annotations).toBeDefined();

    // Second request: uses cache
    const response2 = await api.post('/v1/chat/completions', {
      model: 'claude-opus',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is the main topic?' },
            {
              type: 'file',
              file: {
                filename: 'bitcoin.pdf',
                file_data: pdfUrl
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: 'The Bitcoin whitepaper describes...',
          annotations: response1.body.choices[0].message.annotations
        }
      ]
    });

    expect(response2.status).toBe(200);
    // Verify from logs that cached was true
  });
});
```

---

## Implementation Timeline

### Week 1: Core Infrastructure
```
Day 1-2: Database schema + migrations
Day 3:   Type definitions + validation classes
Day 4:   Image input support
Day 5:   Audio input support
```

### Week 2: Advanced Features
```
Day 6:   Video input support
Day 7:   PDF processing + caching
Day 8:   Image generation support
Day 9:   Provider capability detection
Day 10:  Testing + bug fixes
```

### Week 3: Deployment
```
Day 11:  Performance testing
Day 12:  Documentation + examples
Day 13:  Release + monitoring
Day 14:  Buffer for issues
```

---

## Success Criteria

- ✅ All image formats (JPEG, PNG, WebP, GIF) supported
- ✅ Audio input for Gemini, Claude 3.5
- ✅ Video input for Gemini with YouTube + base64 support
- ✅ PDF processing with 3 engines
- ✅ Image generation with aspect ratio control
- ✅ File annotation caching reducing re-parses
- ✅ Full multimodal E2E tests passing
- ✅ Zero regression on non-multimodal requests

---

**Ready to implement!** 🚀
