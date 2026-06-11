import useTimesheet from "@/store/timesheet";
import { GoogleGenAI, Type } from "@google/genai";
import { useState } from "react";
import { toast } from "sonner";

export function useAiTimesheet(
  selectedDate: string | null,
  setRows: (rows: any[]) => void,
) {
  const { setEntriesForDate, geminiApiKey } = useTimesheet();
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiWorklog, setAiWorklog] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState("");

  const handleGenerateAi = async () => {
    if (!geminiApiKey) {
      toast.error("Please set your Gemini API Key in Settings first.");
      return;
    }

    if (!selectedDate) return;

    try {
      setIsGenerating(true);
      setAiStatus("Generating timesheets...");

      const prompt = `
      You are a professional assistant. Convert the following rough worklog into structured timesheet entries.
      The output MUST be a JSON object with a key "days" containing a list of date groups.
      If the input worklog does not specify dates, default to mapping all generated entries to the active date "${selectedDate}".

      Constraints:
      1. For each date, divide the worklog into standard working hours (usually starting from 08:00 until 17:00, with a 1-hour break between 12:00 and 13:00 if the time span covers it).
      2. The maximum number of entries (array length) per date is 5.
      3. Make the activity descriptions detailed, formal, and professional.

      Active Date: ${selectedDate}

      Rough Worklog Input:
      ${aiWorklog}

      JSON Output (match the exact schema specified):
`;

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
                          activity: { type: Type.STRING },
                        },
                        required: ["startTime", "endTime", "activity"],
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

      console.log({ response });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("No response text returned from AI model");
      }

      const parsed = JSON.parse(resultText);
      const days = parsed.days || [];
      const generatedEntries: Record<string, any[]> = {};
      days.forEach((day: any) => {
        if (day.date && Array.isArray(day.entries)) {
          generatedEntries[day.date] = day.entries;
        }
      });

      let updatedOtherDatesCount = 0;
      let selectedDateUpdated = false;

      Object.entries(generatedEntries).forEach(
        ([date, entriesArray]: [string, any[]]) => {
          const cleanEntries = entriesArray.slice(0, 5);

          if (date === selectedDate) {
            setRows(
              cleanEntries.map((e) => ({
                id: crypto.randomUUID(),
                startTime: e.startTime,
                endTime: e.endTime,
                activity: e.activity,
              })),
            );
            selectedDateUpdated = true;
          } else {
            setEntriesForDate(
              date,
              cleanEntries.map((e) => ({
                startTime: e.startTime,
                endTime: e.endTime,
                activity: e.activity,
              })),
            );
            updatedOtherDatesCount++;
          }
        },
      );

      if (updatedOtherDatesCount > 0) {
        setAiStatus(
          `Success! Generated timesheet for ${selectedDateUpdated ? "today and " : ""}${updatedOtherDatesCount} other date(s).`,
        );
      } else if (selectedDateUpdated) {
        setAiStatus("Success! Generated timesheet for today.");
      } else {
        setAiStatus("No entries generated.");
      }

      setTimeout(() => {
        setShowAiInput(false);
        setAiStatus("");
        setAiWorklog("");
      }, 2500);
    } catch (error) {
      console.error(error);
      let errorMsg = "Failed to generate timesheet.";
      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message);
          errorMsg = parsed?.error?.message || error.message;
        } catch {
          errorMsg = error.message;
        }
      }
      setAiStatus(`Error: ${errorMsg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    showAiInput,
    setShowAiInput,
    aiWorklog,
    setAiWorklog,
    isGenerating,
    aiStatus,
    setAiStatus,
    handleGenerateAi,
    geminiApiKey,
  };
}
