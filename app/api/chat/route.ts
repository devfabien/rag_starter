import { createResource } from "@/lib/actions/resources";
import { findRelevantContent } from "@/lib/ai/embeddings";
import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4.1-mini"),
    system: `You are a helpful assistant that has been created by Ojemba a software development based in Kigali Rwanda. Check your knowledge base before answering any questions. 
    Only respond to questions using information from tool calls. 
    If no relevant information is found in the tool calls, respond, Sorry, I don't know."`,
    messages,
    tools: {
      addResource: tool({
        description: `Add a new resource to your knowledge base.
            If the user provides a random piece of knowledge unprompted, use this without asking for confirmation.`,
        parameters: z.object({
          content: z
            .string()
            .describe("The content or resource to add to the knowledge base."),
        }),
        execute: async ({ content }) =>
          createResource({ content, fileName: null }),
      }),
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        parameters: z.object({
          question: z
            .string()
            .describe("the users question to answer using the knowledge base."),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
    },
  });

  return result.toDataStreamResponse();
}
