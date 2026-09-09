import { z } from "zod";

/** Role modelu w systemie — każda ma osobny wpis w routing_policies/model_catalog. */
export type AiRole =
  | "product_analysis"
  | "scenario"
  | "prompt_builder"
  | "prototype_image"
  | "final_image"
  | "quality_gate"
  | "trend_research"
  | "content";

export interface ProviderUsage {
  inputTokens?: number;
  cachedInputTokens?: number;
  outputTokens?: number;
  imageInputTokens?: number;
  imageOutputTokens?: number;
  imagesGenerated?: number;
  webSearchCalls?: number;
  raw?: unknown;
}

export interface ReferenceImageInput {
  id: string;
  base64: string;
  mimeType: string;
  role: "master" | "supporting";
}

// --- Product Analyzer / Product Lock -----------------------------------

export const productProfileSchema = z.object({
  product_name: z.string(),
  product_type_key: z.string(),
  product_type_confidence: z.enum(["low", "medium", "high"]),
  product_type_alternative: z.string().nullable(),
  variant_name: z.string().nullable(),
  audience_context_key: z.string(),
  materials: z.array(z.string()),
  main_colors: z.array(z.string()),
  secondary_colors: z.array(z.string()),
  element_count: z.number().int().nullable(),
  element_sequence: z.array(z.string()),
  shapes: z.array(z.string()),
  relative_sizes: z.string(),
  wooden_elements: z.array(z.string()),
  silicone_elements: z.array(z.string()),
  cord: z.string().nullable(),
  clasp: z.string().nullable(),
  hardware: z.array(z.string()),
  text_elements: z.array(z.string()),
  letters: z.string().nullable(),
  engraving: z.string().nullable(),
  personalization_detected: z.boolean(),
  critical_features: z.array(z.string()),
  usage: z.string(),
  forbidden_transformations: z.array(z.string()),
  safety_context: z.string().nullable(),
  notes: z.string().nullable(),
  uncertain_fields: z.array(z.string()),
  analysis_confidence: z.enum(["low", "medium", "high"]),
  suggested_master_reference_index: z.number().int(),
  reference_quality_status: z.enum(["sufficient", "can_improve"]),
  reference_quality_notes: z.array(z.string()).max(2),
});
export type ProductProfileResult = z.infer<typeof productProfileSchema>;

export interface ProductAnalysisInput {
  references: ReferenceImageInput[];
  productTypeOptions: { key: string; label: string }[];
  audienceOptions: { key: string; label: string }[];
}

// --- Concept Engine -------------------------------------------------------

export const conceptSchema = z.object({
  idea_pl: z.string(),
  scenario: z.object({
    subject_type: z.string(),
    apparent_age_group: z.string().nullable(),
    hair: z.string().nullable(),
    wardrobe: z.string().nullable(),
    location_type: z.string(),
    palette: z.string(),
    lighting: z.string(),
    camera_language: z.string(),
    composition: z.string(),
    time_of_day: z.string(),
    props: z.array(z.string()),
    mood: z.string(),
  }),
});
export type ConceptResult = z.infer<typeof conceptSchema>;

export interface ConceptInput {
  productSummary: string;
  rulePack: object;
  photoType: string;
  purpose: string;
  featuredSubject: string;
  audienceLabel: string;
  recentScenarios: object[];
  trendPoints: string[];
  userNote?: string;
  creative: boolean;
}

// --- Quality Gate -----------------------------------------------------

export const qualityReviewSchema = z.object({
  product_fidelity: z.enum(["high", "medium", "low"]),
  realism: z.enum(["high", "medium", "low"]),
  numerical_score: z.number().min(0).max(100),
  confidence: z.enum(["low", "medium", "high"]),
  issues_pl: z.array(z.string()).max(6),
  checks: z.object({
    colors_match: z.boolean(),
    element_count_match: z.boolean(),
    order_match: z.boolean(),
    lettering_match: z.boolean(),
    clasp_hardware_match: z.boolean(),
    proportions_match: z.boolean(),
    physical_realism: z.boolean(),
    anatomy_ok: z.boolean(),
    no_artifacts: z.boolean(),
    lighting_realistic: z.boolean(),
  }),
});
export type QualityReviewResult = z.infer<typeof qualityReviewSchema>;

export interface QualityGateInput {
  references: ReferenceImageInput[];
  finalImageBase64: string;
  productProfile: Record<string, unknown>;
}

// --- Content Studio -----------------------------------------------------

export const contentResultSchema = z.object({
  channel: z.enum(["instagram", "meta_ads", "sklep", "pinterest"]),
  instagram: z
    .object({ caption: z.string(), alt: z.string(), hashtags: z.array(z.string()) })
    .optional(),
  meta_ads: z
    .object({ primary_text: z.string(), headline: z.string(), description: z.string() })
    .optional(),
  sklep: z
    .object({ alt: z.string(), seo_filename: z.string(), short_description: z.string() })
    .optional(),
  pinterest: z.object({ title: z.string(), description: z.string() }).optional(),
});
export type ContentResult = z.infer<typeof contentResultSchema>;

export interface ContentInput {
  channel: "instagram" | "meta_ads" | "sklep" | "pinterest";
  productSummary: string;
  photoType: string;
  verifiedFacts: string[];
  brandVoice: string;
}

// --- Trend Radar -----------------------------------------------------

export const trendBriefSchema = z.object({
  points: z
    .array(
      z.object({
        summary_pl: z.string(),
        relevance: z.string(),
        confidence: z.enum(["low", "medium", "high"]),
        sources: z.array(z.object({ title: z.string(), url: z.string().nullable() })),
      }),
    )
    .max(6),
});
export type TrendBriefResult = z.infer<typeof trendBriefSchema>;

// --- Image generation --------------------------------------------------

export interface ImageGenerationInput {
  prompt: string;
  references: ReferenceImageInput[];
  aspectRatio: string;
  quality: "low" | "medium" | "high";
}

export interface ImageGenerationResult {
  base64: string;
  format: "png" | "jpeg" | "webp";
  usage: ProviderUsage;
}

// --- Provider interfaces (dopuszczają przyszłą podmianę providera per rola) ---

export interface TextVisionProvider {
  analyzeProduct(
    input: ProductAnalysisInput,
  ): Promise<{ result: ProductProfileResult; usage: ProviderUsage }>;
  proposeConcept(input: ConceptInput): Promise<{ result: ConceptResult; usage: ProviderUsage }>;
  generateContent(input: ContentInput): Promise<{ result: ContentResult; usage: ProviderUsage }>;
  researchTrends(
    workspaceContext: string,
  ): Promise<{ result: TrendBriefResult; usage: ProviderUsage }>;
}

export interface ImageProvider {
  generate(
    input: ImageGenerationInput,
    modelId: string,
  ): Promise<ImageGenerationResult>;
}

export interface CriticProvider {
  reviewQuality(
    input: QualityGateInput,
  ): Promise<{ result: QualityReviewResult; usage: ProviderUsage }>;
}
