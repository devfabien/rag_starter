// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { PdfReader } from "pdfreader";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/resources";
import { embeddings as embeddingsTable } from "@/lib/db/schema/embeddings";
import { generateEmbeddings } from "@/lib/ai/embeddings";

export function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    let currentPage = 0;
    let text = "";

    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) return reject(err);

      if (!item) {
        // done
        return resolve(text.trim());
      }
      if (item.page && item.page !== currentPage) {
        currentPage = item.page;
        if (text.length) {
          text += "\n\n";
        }
      }

      if (item.text) {
        const chunk = item.text.includes("%")
          ? decodeURIComponent(item.text)
          : item.text;
        text += chunk + " ";
      }
    });
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return new Response(JSON.stringify({ error: "No file uploaded" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const text = await extractTextFromPDF(buffer);
  if (!text.trim()) {
    return NextResponse.json({
      error: "No text extracted from the PDF file.",
      status: 422,
    });
  }

  const [resource] = await db
    .insert(resources)
    .values({ content: text, fileName: file.name })
    .returning();

  const chunksWithEmb = await generateEmbeddings(text);

  if (chunksWithEmb.length === 0) {
    return NextResponse.json(
      { error: "Failed to chunk PDF text" },
      { status: 500 }
    );
  }

  await db.insert(embeddingsTable).values(
    chunksWithEmb.map((chunk) => ({
      resourceId: resource.id,
      content: chunk.content,
      embedding: chunk.embedding,
    }))
  );

  return NextResponse.json({
    message: "Uploaded & indexed!",
    resourceId: resource.id,
  });
}
