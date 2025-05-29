import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/resources";
import { embeddings as embeddingsTable } from "@/lib/db/schema/embeddings";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import { eq } from "drizzle-orm";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { extractTextFromPDF } from "@/app/api/upload/route";

const URL = "";

export async function initResourceFromURL() {
  const { content, contentType } = await fetchResource(URL);

  console.log("text", content);
  console.log("contentType", contentType);

  if (!content.trim()) {
    console.warn("❌ Empty content extracted");
    return;
  }

  // const crypto = await import("crypto");
  // const checksum = crypto.createHash("sha256").update(content).digest("hex");

  const existing = await db
    .select()
    .from(resources)
    .where(eq(resources.fileName, "hosted-startupg"));

  if (existing.length && existing[0].content === content) {
    console.log("PDF content already up-to-date, skipping.");
    return;
  }

  const [resource] = await db
    .insert(resources)
    .values({ content, fileName: "hosted-startupg" })
    .returning();

  const chunksWithEmb = await generateEmbeddings(content);

  await db.insert(embeddingsTable).values(
    chunksWithEmb.map((chunk) => ({
      resourceId: resource.id,
      content: chunk.content,
      embedding: chunk.embedding,
    }))
  );

  console.log("🚀 Hosted documents initialized and embedded!");
}

async function fetchResource(
  url: string
): Promise<{ content: string; contentType: string }> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status} ${response.statusText}`
      );
    }

    // Get content type
    const contentType = response.headers.get("content-type") || "";
    console.log("contentTypeddd", contentType);

    // Handle HTML content
    if (contentType.includes("text/html")) {
      const html = await response.text();
      const content = extractMainContent(html, url);
      return { content, contentType };
    }
    // Handle PDF content
    else if (contentType.includes("application/pdf")) {
      const buffer = Buffer.from(await response.arrayBuffer());
      const content = await extractTextFromPDF(buffer);
      return { content, contentType };
    }
    // Handle plain text
    else if (contentType.includes("text/plain")) {
      const content = await response.text();
      return { content, contentType };
    }
    // Unsupported type
    else {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
  } catch (error) {
    console.error("Resource fetch error:", error);
    return { content: "", contentType: "" };
  }
}

function extractMainContent(html: string, url: string): string {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    return (
      article?.textContent?.trim() ||
      dom.window.document.body.textContent?.trim() ||
      ""
    );
  } catch (error) {
    console.error("Content extraction error:", error);
    return "";
  }
}
