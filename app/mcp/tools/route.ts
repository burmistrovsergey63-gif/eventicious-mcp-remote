import { NextResponse } from "next/server";
import { getToolManifest } from "../../../src/mcp/tools-manifest";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const manifest = getToolManifest();
    return NextResponse.json(manifest);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to load tools manifest", details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}