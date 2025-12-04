import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Subject, Question, LessonContent } from "../types";

// Note: In a real environment, never expose keys on client side. 
// However, per instructions, we access process.env.API_KEY directly.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['quiz', 'typing'] },
    prompt: { type: Type.STRING, description: "The question text or instruction" },
    options: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "4 multiple choice options. Required if type is 'quiz'."
    },
    correctAnswer: { type: Type.STRING, description: "The correct option text. Required if type is 'quiz'." },
    typingText: { type: Type.STRING, description: "The full paragraph or code snippet to type. Required if type is 'typing'." }
  },
  required: ['id', 'type', 'prompt']
};

const lessonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: questionSchema
    }
  },
  required: ['title', 'description', 'questions']
};

export const generateLesson = async (
  level: number,
  subject: Subject
): Promise<LessonContent> => {
  const ai = getAI();
  
  let promptText = "";

  if (subject === Subject.MATH) {
    promptText = `Create a Grade ${level} Math lesson. 
    Include 3 multiple choice questions (type: 'quiz') and 2 typing challenges (type: 'typing') where the student must type a math definition or a number sentence.
    Topics should correspond to Grade ${level} curriculum (e.g. addition for Grade 1, Algebra for Grade 8).`;
  } else if (subject === Subject.ENGLISH) {
    promptText = `Create a Grade ${level} English Grammar lesson.
    Include 3 multiple choice questions (type: 'quiz') spotting errors or choosing words.
    Include 2 typing challenges (type: 'typing') where the student types a grammatically correct sentence or paragraph suitable for their reading level.`;
  } else if (subject === Subject.AI_TECH) {
    promptText = `Create a Grade ${level} lesson about Artificial Intelligence and Technology.
    Simplify concepts for the specific grade level.
    Include 2 quiz questions and 3 typing challenges where they type definitions of AI concepts (e.g., 'Robot', 'Neural Network', 'Data').`;
  } else {
    // Computer Science
    promptText = `Create a Grade ${level} Computer Science lesson.
    For Grades 1-4, focus on hardware/basic terms. For 5-10, focus on coding concepts (Python/JS syntax).
    Include 1 quiz question and 4 typing challenges where they type actual code snippets or definitions.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonSchema,
        systemInstruction: "You are an expert K-12 teacher. Generate accurate, educational, and engaging content. Ensure JSON is valid."
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as LessonContent;
    }
    throw new Error("No content generated");
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback content in case of API failure or missing key
    return {
      title: `${subject} - Grade ${level} (Offline Mode)`,
      description: "We couldn't connect to the AI brain. Here is a sample typing exercise.",
      questions: [
        {
          id: "fallback-1",
          type: "typing",
          prompt: "Type the following sentence accurately:",
          typingText: "Technology helps us learn and grow every single day."
        }
      ]
    };
  }
};