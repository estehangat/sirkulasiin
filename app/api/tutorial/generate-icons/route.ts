import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/* ═══ Validated Lucide icon names (subset most relevant for DIY/crafts) ═══ */
const VALID_ICONS = new Set([
  "Scissors","Ruler","PenTool","Paintbrush","Hammer","Wrench","Drill","Pipette",
  "Droplets","Flame","Wind","Thermometer","Gauge","Target","CircleDot","Scan",
  "Search","Eye","Lightbulb","Sparkles","Star","Zap","Sun","CloudRain","Leaf",
  "TreePine","Flower2","Sprout","Recycle","Trash2","Package","Box","Archive",
  "FolderOpen","Layers","Grid3x3","LayoutGrid","Shapes","Triangle","Square",
  "Circle","Hexagon","Heart","Shield","Lock","Unlock","Key","Settings",
  "SlidersHorizontal","RefreshCw","RotateCcw","Move","Maximize2","Minimize2",
  "ArrowRight","ArrowDown","ArrowUp","Check","CheckCircle","AlertTriangle",
  "Info","HelpCircle","Clock","Timer","Calendar","Camera","Palette",
  "Brush","Eraser","PencilRuler","Compass","ClipboardList","FileText","BookOpen",
  "GraduationCap","FlaskConical","Magnet","Plug","Globe","Map","MapPin",
  "Navigation","Home","Building","Store","Factory","Warehouse","Construction",
  "HardHat","Shovel","Axe","Gem","Crown","Award","Medal","Trophy","Flag",
  "Rocket","Truck","Hand","HandMetal","ThumbsUp","Grip","Focus","Tag",
  "Bookmark","Pin","Paperclip","Link","Puzzle","Send","Download","Upload",
  "Share2","Printer","Users","Activity","TrendingUp","Calculator",
  "ShoppingCart","Gift","Coffee","Wine","UtensilsCrossed","GlassWater",
  "Apple","Wheat","Footprints","Bike","Car","Ship",
]);

/* Common AI misnames → valid Lucide fallbacks */
const FALLBACK_MAP: Record<string, string> = {
  Bottle: "GlassWater", Glass: "GlassWater", Cup: "Coffee",
  Glue: "Pipette", Tape: "Paperclip", Saw: "Axe",
  Nail: "Pin", Screw: "Settings", Bolt: "Wrench",
  Pen: "PenTool", Pencil: "PenTool", Draw: "PenTool",
  Paint: "Paintbrush", Color: "Palette", Colour: "Palette",
  Measure: "Ruler", Scale: "Ruler", Size: "Maximize2",
  Cut: "Scissors", Trim: "Scissors", Slice: "Scissors",
  Wash: "Droplets", Clean: "Droplets", Water: "Droplets",
  Sand: "Eraser", Sandpaper: "Eraser", Polish: "Sparkles",
  Dry: "Wind", Heat: "Flame", Fire: "Flame", Burn: "Flame",
  Assemble: "Wrench", Build: "Construction", Construct: "Construction",
  Inspect: "Eye", View: "Eye", Look: "Eye",
  Finish: "CheckCircle", Done: "CheckCircle", Complete: "CheckCircle",
  Test: "FlaskConical", Verify: "CheckCircle",
  Design: "PenTool", Plan: "ClipboardList", Sketch: "PenTool",
  Plant: "Sprout", Garden: "Leaf", Tree: "TreePine",
  Flower: "Flower2", Rose: "Flower2", Blossom: "Flower2",
  Tool: "Wrench", Tools: "Wrench", Repair: "Wrench",
  Safety: "Shield", Protect: "Shield", Warning: "AlertTriangle",
  Decorate: "Sparkles", Ornament: "Sparkles", Embellish: "Sparkles",
  Attach: "Paperclip", Connect: "Link", Join: "Link",
  Mix: "RefreshCw", Stir: "RefreshCw", Blend: "RefreshCw",
  Pour: "GlassWater", Fill: "GlassWater",
  Fold: "Layers", Stack: "Layers", Layer: "Layers",
  Frame: "Square", Shape: "Shapes", Mold: "Shapes",
  Sew: "Scissors", Stitch: "Scissors", Thread: "Scissors",
  Iron: "Thermometer", Press: "Maximize2",
  Spray: "Pipette", Coat: "Paintbrush",
};

function validateIconName(name: string): string {
  if (VALID_ICONS.has(name)) return name;
  if (FALLBACK_MAP[name]) return FALLBACK_MAP[name];
  return "Recycle";
}

const ICON_PROMPT = `You are an icon name picker. Given DIY/recycling tutorial steps, pick the best matching Lucide icon name for each step.

Available icon names (use ONLY from this list):
Scissors, Ruler, PenTool, Paintbrush, Hammer, Wrench, Drill, Pipette, Droplets, Flame, Wind, Thermometer, Gauge, Target, CircleDot, Scan, Search, Eye, Lightbulb, Sparkles, Star, Zap, Sun, Leaf, TreePine, Flower2, Sprout, Recycle, Trash2, Package, Box, Archive, Layers, Shapes, Square, Circle, Heart, Shield, Lock, Key, Settings, RefreshCw, Move, Check, CheckCircle, AlertTriangle, Info, Clock, Timer, Camera, Palette, Brush, Eraser, PencilRuler, Compass, ClipboardList, FileText, BookOpen, GraduationCap, FlaskConical, Globe, Home, Building, Construction, HardHat, Shovel, Axe, Award, Trophy, Hand, ThumbsUp, Focus, Tag, Pin, Paperclip, Link, Puzzle, Printer, Activity, GlassWater, Coffee

RULES:
- Return JSON object: {"icons": ["IconName1", "IconName2", ...]}
- Pick the most semantically relevant icon for each step
- Use ONLY names from the list above — do NOT invent new names
- Return exactly one icon name per step

Example: {"icons": ["Scissors", "Paintbrush", "Wrench", "CheckCircle"]}`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured." }, { status: 500 });
    }

    const { tutorialId } = (await req.json()) as { tutorialId: string };
    if (!tutorialId) {
      return NextResponse.json({ error: "tutorialId is required." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: tutorial, error: dbErr } = await supabase
      .from("recycle_tutorials")
      .select("steps")
      .eq("id", tutorialId)
      .single();

    if (dbErr || !tutorial) {
      return NextResponse.json({ error: "Tutorial not found." }, { status: 404 });
    }

    type Step = { stepNumber: number; title: string; description: string; iconName?: string; iconSvg?: string };
    const steps = tutorial.steps as Step[];

    // Skip if all steps already have valid icon names
    if (steps.every((s) => s.iconName && VALID_ICONS.has(s.iconName))) {
      return NextResponse.json({ steps });
    }

    const stepSummaries = steps.map((s) => `${s.stepNumber}. ${s.title}: ${s.description}`).join("\n");

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          { role: "system", content: ICON_PROMPT },
          { role: "user", content: `Pick ${steps.length} icons for:\n${stepSummaries}` },
        ],
        temperature: 0.2,
        max_completion_tokens: 512,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      console.error("Groq icons error:", groqRes.status);
      return NextResponse.json({ error: "Failed to generate icons." }, { status: 502 });
    }

    const data = await groqRes.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    console.log("[generate-icons] AI response:", text);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON from AI." }, { status: 502 });
    }

    // Find the first string array in the object
    let rawNames: string[] = [];
    for (const val of Object.values(parsed)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string") {
        rawNames = val;
        break;
      }
    }

    // Validate each name against the whitelist
    const validatedNames = rawNames.map(validateIconName);
    console.log(`[generate-icons] Validated:`, validatedNames);

    // Merge into steps
    const enrichedSteps = steps.map((step, i) => ({
      ...step,
      iconName: validatedNames[i] || "Recycle",
      iconSvg: undefined,
    }));

    const { error: updateErr } = await supabase
      .from("recycle_tutorials")
      .update({ steps: enrichedSteps })
      .eq("id", tutorialId);

    if (updateErr) {
      console.error("[generate-icons] DB update error:", updateErr);
    }

    return NextResponse.json({ steps: enrichedSteps });
  } catch (err: unknown) {
    console.error("Generate icons error:", err);
    const message = err instanceof Error ? err.message : "Internal error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
