import { type NextRequest, NextResponse } from "next/server";
import { generateProject } from "@/lib/generator";
import type { ProjectConfig } from "@/lib/generator/types";

export async function POST(req: NextRequest) {
  try {
    const config = (await req.json()) as ProjectConfig;

    if (!config.name || !/^[a-z0-9-]+$/.test(config.name)) {
      return NextResponse.json({ error: "Nome inválido. Use apenas letras minúsculas, números e hífens." }, { status: 400 });
    }

    const buffer = await generateProject(config);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${config.name}.zip"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao gerar o projeto." }, { status: 500 });
  }
}
