import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

export interface GeneratedEntry {
  id: string;
  startTime: string;
  endTime: string;
  project: string;
  task: string;
  activity: string;
}

export const InputSchema = z.string()
  .min(5, "Input worklog must be at least 5 characters.")
  .max(10000, "Input worklog must not exceed 10000 characters.")
  .refine(
    (val) => {
      const suspiciousPatterns = [
        /ignore\s+(?:previous|all|the)\s+(?:instruction|directive|rule|constraint|prompt)/i,
        /system\s+(?:prompt|message|instruction)/i,
        /override\s+(?:constraint|rule|instruction)/i,
        /you\s+must\s+(?:forget|ignore)/i,
        /instead\s+of\s+generating/i,
        /translate\s+this\s+text\s+instead/i,
        /new\s+(?:instruction|prompt|task)\:/i
      ];
      return !suspiciousPatterns.some((pattern) => pattern.test(val));
    },
    {
      message: "Potential prompt injection detected. Please enter a valid worklog description."
    }
  );

export const EntrySchema = z.object({
  startTime: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid startTime format (expected HH:MM)"),
  endTime: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid endTime format (expected HH:MM)"),
  project: z.string().trim().max(100, "Project name must not exceed 100 characters"),
  task: z.string().trim().min(3, "Task must be at least 3 characters").max(150, "Task must not exceed 150 characters"),
  activity: z.string().trim().min(10, "Activity must be at least 10 characters").max(1000, "Activity must not exceed 1000 characters")
});

export const DaySchema = z.object({
  date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, "Invalid date format (expected YYYY-MM-DD)"),
  entries: z.array(EntrySchema).length(5, "Each day must have exactly 5 timesheet entries")
});

export const OutputSchema = z.object({
  days: z.array(DaySchema)
});

export async function generateTimesheetFromAi(
  worklog: string,
  selectedDate: string,
  projectName: string,
  apiKey: string,
  modelName: string
): Promise<Record<string, GeneratedEntry[]>> {
  // Validate input worklog first
  InputSchema.parse(worklog);

  const prompt = `
  You are a professional assistant. Convert the following rough worklog into structured timesheet entries.
  The output MUST be a JSON object with a key "days" containing a list of date groups.
  If the input worklog does not specify dates, default to mapping all generated entries to the selected date "${selectedDate}".

  Rules:
  - Use these exact time slots:
    1. 08:00 - 10:00
    2. 10:00 - 11:00
    3. 11:00 - 12:00
    4. 13:00 - 15:00
    5. 15:00 - 17:00
  - Use the provided project name if available: "${projectName}". If not provided, try to infer it from the worklog or leave it empty/default.
  - Each entry must have: startTime, endTime, project, task, activity.
  - Task should be short and specific.
  - Activity should be professional and detailed.
  - Do not invent unrelated work.
  - Distribute the tasks from the worklog across the 5 slots. If the worklog doesn't have enough tasks to cover all 5 slots, extend/elaborate on the tasks, or split them into subtasks to ensure exactly 5 slots are generated for each day.

  Selected Date: ${selectedDate}
  Rough Worklog Input:
  ${worklog}

  JSON Output (match the exact schema specified):
`;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: modelName || "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                entries: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      startTime: { type: Type.STRING },
                      endTime: { type: Type.STRING },
                      project: { type: Type.STRING },
                      task: { type: Type.STRING },
                      activity: { type: Type.STRING },
                    },
                    required: ["startTime", "endTime", "project", "task", "activity"],
                  },
                },
              },
              required: ["date", "entries"],
            },
          },
        },
        required: ["days"],
      },
    },
  });

  const resultText = response.text;
  if (!resultText) {
    throw new Error("No response text returned from AI model");
  }

  const parsed = JSON.parse(resultText);
  const validated = OutputSchema.parse(parsed);
  const days = validated.days || [];
  const entriesMap: Record<string, GeneratedEntry[]> = {};
  days.forEach((day) => {
    entriesMap[day.date] = day.entries.map((e) => ({
      id: crypto.randomUUID(),
      startTime: e.startTime,
      endTime: e.endTime,
      project: e.project,
      task: e.task,
      activity: e.activity,
    }));
  });
  return entriesMap;
}

export function formatAiError(err: unknown): string {
  let errorMsg = "Failed to parse timesheet.";
  if (err instanceof z.ZodError) {
    errorMsg = `AI Schema mismatch: ${err.errors[0].message} (path: ${err.errors[0].path.join(".")})`;
  } else if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message);
      errorMsg = parsed?.error?.message || err.message;
    } catch {
      errorMsg = err.message;
    }
  } else if (typeof err === "string") {
    errorMsg = err;
  }
  return `Error: ${errorMsg}`;
}
