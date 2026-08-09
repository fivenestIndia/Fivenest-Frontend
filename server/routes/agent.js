import express from "express";
import { askAgent, askAgentVision } from "../services/agentService.js";

const router = express.Router();

// Knowledge Base System Instruction to train the AI to give precise, concise, brand-aligned answers
const FIVENEST_STRICT_SYSTEM_INSTRUCTION = `You are Fivenest AI — the official assistant for Fivenest Production OS & Sportswear Design Studio (https://www.fivenest.in).

CRITICAL RESPONSE RULES:
1. ALWAYS give short, direct, concise answers (maximum 2 to 3 sentences or bullet points).
2. NEVER output generic fluff, filler text, or long off-topic intros.
3. Use the Fivenest Knowledge Base below for all facts. If asked something unrelated to Fivenest/sports/design/printing, politely direct them to Fivenest services.

FIVENEST KNOWLEDGE BASE:
- WHAT IS FIVENEST: Fivenest is a Cloud Production Platform & Design Studio for sportswear manufacturers. It automates 300 DPI print file generation, automatic sizing, nesting, and CorelDraw/Photoshop plugin workflows.
- TURNAROUND TIME: Standard production is 3-5 business days; Express manufacturing is 24-48 hours.
- PRINT SPECIFICATIONS: 300 DPI resolution, CMYK/RGB colorspace, 0.5-inch bleed margins, supported formats: PDF, SVG, AI, CDR (CorelDraw), EPS, PNG.
- PRODUCTS: Sublimation Cricket, Football, Kabaddi, Basketball jerseys, Polo T-shirts, Tracksuits, Hoodies, Shorts.
- PLUGINS: Photoshop & CorelDraw auto-nesting plugins to convert mockups to 300 DPI print-ready layout files.
- PRICING: Pay only for what you generate. Bulk factory plans available.
- SUPPORT: Email fivenest.india@gmail.com, WhatsApp +919999999999, or use the Contact Support Ticket tab in this widget.`;

/**
 * @route   POST /api/agent/chat
 * @desc    Multimodal Chat & Image Pre-Press Analysis Endpoint
 * @access  Public
 */
router.post("/chat", async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType, systemInstruction, model } = req.body;

    if ((!prompt || typeof prompt !== "string") && !imageBase64) {
      return res.status(400).json({ error: "A valid 'prompt' string or image is required." });
    }

    let reply;
    if (imageBase64) {
      // Process image attachment using Sublimation Pre-Press Master Vision Pipeline
      const prepressInstruction = SUBLIMATION_PREPRESS_MASTER_PROMPT;
      reply = await askAgentVision(prompt || "Convert attached mockup image to 22x30 inch 300 DPI print spec", imageBase64, mimeType, prepressInstruction);
    } else {
      const instruction = systemInstruction || FIVENEST_STRICT_SYSTEM_INSTRUCTION;
      reply = await askAgent(prompt, instruction, model);
    }

    res.status(200).json({
      success: true,
      model: model || process.env.AGENT_MODEL || "llama-3.3-70b-versatile",
      reply: reply,
    });
  } catch (error) {
    console.error("Error in /api/agent/chat:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate AI response",
    });
  }
});

const SUBLIMATION_PREPRESS_MASTER_PROMPT = `Sublimation Pre-Press & Print Production Master
Role & Identity:
You are an expert Apparel Sublimation Pre-Press Specialist and Graphic Production AI. Your sole objective is to take images or descriptions of 3D clothing mockups (t-shirts, polo shirts, jerseys), analyze their graphic elements, and reconstruct the artwork into a crisp, high-resolution, flat rectangular canvas that is 100% ready for print production.

Core Workflow & Processing Pipeline:
Step 1: Visual Analysis & Deconstruction
- Identify Elements: Background patterns (grunge brushstrokes, gradients), hero illustrations (mascots, graphics), typography/logos.
- Color Palette Extraction: Map exact color HEX/Pantone values.
- Ignore Garment Physics: Strip away lighting, cloth wrinkles, draping shadows, and fabric texture.

Step 2: Structural Stripping & Element Cleaning
- Remove Garment Hardware: Strip away collars, plackets, buttons, sleeves, side seams, stitching, tags, and cut marks.
- Isolate Core Artwork: Flatten front chest/panel graphic into a 2D plane.
- Smart Filtering: Cleanly excise logos/text if requested while seamlessly extending background patterns to fill empty space.

Step 3: Dimensional Canvas Projection
- Standardize Canvas: Project cleaned graphic onto a standardized 22 x 30 inch vertical canvas (full-front sublimation or DTF).
- Edge-to-Edge Bleed: Ensure background elements extend to boundary edges with zero unprinted margins.

Step 4: 3x Quality Enhancement & Vector-Grade Upscaling
- Eliminate Compression: Remove pixelation and JPEG artifacts.
- High-Definition Rendering: Recreate artwork at 3x enlarged resolution (8K / 300 DPI standards).
- Sharpen Details: Render line art with sharp vector-like edge precision.

OUTPUT FORMATTING:
Output a flat, high-resolution 22 x 30 inch rectangular artwork specification and Production Spec Sheet:
- Canvas Size: 22 x 30 inches (Vertical Portrait)
- Resolution Target: 300 DPI / 8K Print-Ready Ultra HD
- Color Palette: [List primary colors identified]
- Modifications Applied: [List structural stripping, collar/seam removal, and background bleed extension]`;

/**
 * @route   POST /api/agent/convert-to-print
 * @desc    Converts a jersey mockup/concept into 300 DPI print-ready sublimation specs & panel vector layout
 * @access  Public
 */
router.post("/convert-to-print", async (req, res) => {
  try {
    const { designName, sport, size, dpi, colorSpace, mockupDescription } = req.body;

    const printPrompt = `Execute Sublimation Pre-Press Pipeline for uploaded 3D garment mockup:
Mockup/Design Name: ${designName || "Apparel Mockup Graphic"}
Garment Type / Sport: ${sport || "Jersey/Polo Shirt"}
Target Size: ${size || "22 x 30 inches"}
Target Resolution: ${dpi || 300} DPI
Colorspace: ${colorSpace || "CMYK Sublimation"}
Mockup Image Description / Specs: "${mockupDescription || "3D polo jersey mockup with chest graphic, collar, sleeves, diagonal gradient brushstrokes, and text"}"

Execute all 4 Pre-Press steps and produce the flat 2D 22x30 inch 300 DPI Print Spec Sheet.`;

    const printSpecs = await askAgent(printPrompt, SUBLIMATION_PREPRESS_MASTER_PROMPT);
    const mockupId = `FN-PREPRESS-${Math.floor(100000 + Math.random() * 900000)}`;

    res.status(200).json({
      success: true,
      printJobId: mockupId,
      designName: designName || "Sublimation Flat Artwork",
      canvasDimensions: "22 x 30 inches (Flat 2D Canvas)",
      dpi: dpi || 300,
      colorSpace: colorSpace || "CMYK Sublimation",
      printLayoutSpecs: printSpecs,
      downloadFormats: ["300_DPI_PDF", "VECTOR_SVG", "CORELDRAW_CDR", "PHOTOSHOP_PSD"],
    });
  } catch (error) {
    console.error("Error in /api/agent/convert-to-print:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to convert mockup to print file",
    });
  }
});

/**
 * @route   POST /api/agent/generate-design
 * @desc    Specialized prompt helper for Jersey & Graphic design concepts
 * @access  Public
 */
router.post("/generate-design", async (req, res) => {
  try {
    const { theme, colors, sport } = req.body;

    const prompt = `Generate 3 unique jersey design concepts for a ${sport || "sports"} team. Theme: ${theme || "modern cyber"}. Preferred colors: ${colors || "neon blue and black"}. Provide layout ideas, graphic patterns, and badge placement. Keep response concise under 150 words.`;

    const reply = await askAgent(prompt, FIVENEST_STRICT_SYSTEM_INSTRUCTION);

    res.status(200).json({
      success: true,
      concepts: reply,
    });
  } catch (error) {
    console.error("Error in /api/agent/generate-design:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate design concepts",
    });
  }
});

/**
 * @route   POST /api/agent/contact-support
 * @desc    Submit a customer support inquiry and get instant AI resolution + ticket confirmation
 * @access  Public
 */
router.post("/contact-support", async (req, res) => {
  try {
    const { name, email, issue, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: "Email and message are required to submit support request." });
    }

    const ticketId = `FN-TICKET-${Math.floor(100000 + Math.random() * 900000)}`;

    const supportPrompt = `Customer Support Ticket Submission:
Ticket ID: ${ticketId}
Customer Name: ${name || "Valued Customer"}
Email: ${email}
Category/Issue: ${issue || "General Support Inquiry"}
User Message: "${message}"

Please act as Fivenest Official Senior Customer Support Specialist. Provide a helpful, polite, and concise resolution to the customer's request (max 3-4 bullet points). Include next steps, reassure them, and let them know their ticket ${ticketId} has been logged with the Fivenest Support Team (fivenest.india@gmail.com).`;

    const resolution = await askAgent(supportPrompt, FIVENEST_STRICT_SYSTEM_INSTRUCTION);

    res.status(200).json({
      success: true,
      ticketId,
      customer: { name, email, issue },
      resolution,
      supportEmail: "fivenest.india@gmail.com",
      whatsappSupport: "+919999999999",
    });
  } catch (error) {
    console.error("Error in /api/agent/contact-support:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process support request",
    });
  }
});

/**
 * @route   GET /api/agent/status
 * @desc    Check status of AgentRouter configuration
 * @access  Public
 */
router.get("/status", (req, res) => {
  const configured = Boolean(process.env.AGENTROUTER_API_KEY);
  res.json({
    status: configured ? "configured" : "unconfigured",
    provider: process.env.AGENTROUTER_BASE_URL?.includes("groq") ? "Groq Cloud AI" : "AI Gateway Router",
    baseUrl: process.env.AGENTROUTER_BASE_URL || "https://api.groq.com/openai/v1",
    defaultModel: process.env.AGENT_MODEL || "llama-3.3-70b-versatile",
  });
});

export default router;
