import { Question, ParseResult, ParseIssue, CorrectOption } from '../types/quiz';

// Helper to generate unique IDs
export const generateId = () => {
  return 'q_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
};

export const generateSetId = () => {
  return 'set_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
};

// Clean markdown bold, markers, underscores, tags
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<mark>|<\/mark>/gi, '')
    .replace(/<sup>|<\/sup>/gi, '')
    .replace(/<u>|<\/u>/gi, '')
    .replace(/^[*_#\s\t-]+/, '')
    .replace(/[*_#\s\t-]+$/, '')
    .trim();
}

/**
 * Robust multi-format Question Parser
 * Supports:
 * 1. Standard structured Markdown (## Question / A. / B. / Answer: B)
 * 2. Exam Book / RRB Question format (**1. Question?** (a) ... **Ans. (a):** ...)
 * 3. Numbered Plain text format
 */
export function parseMarkdownQuestions(rawContent: string, defaultTitle = 'Imported Question Set'): ParseResult {
  const issues: ParseIssue[] = [];
  const questions: Question[] = [];

  if (!rawContent || !rawContent.trim()) {
    return {
      title: defaultTitle,
      questions: [],
      issues: [{ index: 0, type: 'error', message: 'File content is completely empty' }],
      totalParsed: 0,
      validCount: 0,
    };
  }

  // 1. Attempt to derive title from the top level # header
  let parsedTitle = defaultTitle;
  const titleMatch = rawContent.match(/^#\s+([^\n\r]+)/m);
  if (titleMatch && titleMatch[1]) {
    const candidate = cleanText(titleMatch[1]);
    if (candidate && candidate.length > 2 && !candidate.toLowerCase().includes('part-')) {
      parsedTitle = candidate;
    }
  }

  // Normalize line breaks
  const normalized = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Strategy A: Check for RRB style patterns: "**Ans. (" or "Ans. (" or "Ans: (" or "Answer:"
  // If the document has many questions, we can split by question blocks.
  const blocks = splitIntoQuestionBlocks(normalized);

  blocks.forEach((block, idx) => {
    const questionIndex = idx + 1;
    const parseResult = parseSingleBlock(block, questionIndex);

    if (parseResult.question) {
      questions.push(parseResult.question);
    }

    if (parseResult.issues.length > 0) {
      issues.push(...parseResult.issues);
    }
  });

  return {
    title: parsedTitle,
    questions,
    issues,
    totalParsed: questions.length,
    validCount: questions.filter(q => q.question_text && q.option_a && q.option_b && q.option_c && q.option_d && q.correct_answer).length,
  };
}

/**
 * Splits text into question blocks based on question delimiters
 */
function splitIntoQuestionBlocks(content: string): string[] {
  // Check delimiters like:
  // "## Question", "### Question",
  // "**1. ", "**2. ", or "\n1. ", "\n2. ",
  // or "Question 1:"

  // Test if document uses ## Question or ### Question
  if (/(?:^|\n)##+\s+(?:Question|\d+\.)/i.test(content)) {
    const parts = content.split(/(?:^|\n)(?=##+\s+(?:Question|\d+\.))/i);
    return parts.map(p => p.trim()).filter(p => p.length > 20);
  }

  // Test if document uses **1. or **\d+\.
  if (/(?:^|\n)\*\*\d+\.\s+/m.test(content)) {
    const parts = content.split(/(?:^|\n)(?=\*\*\d+\.\s+)/);
    return parts.map(p => p.trim()).filter(p => p.length > 20);
  }

  // Test if document uses standard numbered questions: 1. Question?
  if (/(?:^|\n)\d{1,4}\.\s+[A-Z]/m.test(content)) {
    const parts = content.split(/(?:^|\n)(?=\d{1,4}\.\s+[A-Z])/);
    return parts.map(p => p.trim()).filter(p => p.length > 20);
  }

  // Fallback: split by double blank lines
  const chunks = content.split(/\n\s*\n\s*\n/);
  return chunks.map(c => c.trim()).filter(c => c.length > 25);
}

/**
 * Parse an individual question block into a structured Question object
 */
function parseSingleBlock(block: string, index: number): { question: Question | null; issues: ParseIssue[] } {
  const issues: ParseIssue[] = [];

  // Extract Answer & Explanation first
  let correctAnswer: CorrectOption | null = null;
  let explanation = '';
  let examRef = '';

  // Look for exam reference like: **RRB NTPC 11.02.2021 (Shift-I) Stage Ist** or RPF SI 18.01.2019
  const examMatch = block.match(/(?:RRB|RPF|SSC|UPSC|Railway|CBT)[\w\s.,/()–-]+(?:Stage\s+[IVstndrd]+|\d{4}|Shift-?[IVX\d]+)?/i);
  if (examMatch) {
    examRef = cleanText(examMatch[0]);
  }

  // Extract answer and explanation
  // Patterns:
  // **Ans. (b) :** Explanation...
  // Ans. (a) : Explanation...
  // Answer: B
  // Correct Answer: C
  // Ans: (b)
  const ansRegex = /(?:\*\*Ans\.?\s*\(([a-d])\)\s*:\*\*|\*\*Ans\.?\s*:\s*\(([a-d])\)|\b(?:Ans(?:wer)?\.?|Correct\s+Answer)\s*(?::|\.)?\s*\(?([a-d])\)?(?:\s*:)?)([\s\S]*)$/i;
  const ansMatch = block.match(ansRegex);

  let remainingBlock = block;

  if (ansMatch) {
    const letter = (ansMatch[1] || ansMatch[2] || ansMatch[3] || '').toUpperCase();
    if (letter === 'A' || letter === 'B' || letter === 'C' || letter === 'D') {
      correctAnswer = letter as CorrectOption;
    }
    explanation = cleanText(ansMatch[4] || '');
    // remove answer part from remaining block so it doesn't pollute options
    remainingBlock = block.substring(0, ansMatch.index).trim();
  } else {
    // Check if there's an answer without parens like "Answer: B"
    const simpleAnsMatch = block.match(/(?:Answer|Ans|Correct)\s*[:=]\s*([A-D])\b/i);
    if (simpleAnsMatch) {
      correctAnswer = simpleAnsMatch[1].toUpperCase() as CorrectOption;
      const splitIdx = block.indexOf(simpleAnsMatch[0]);
      const after = block.substring(splitIdx + simpleAnsMatch[0].length);
      explanation = cleanText(after.replace(/^[:\s-]+/, ''));
      remainingBlock = block.substring(0, splitIdx).trim();
    }
  }

  // Extract Question text and Options
  // Options can be:
  // (a) ... (b) ... (c) ... (d) ...
  // or A. ... B. ...
  // or - A. ...
  // or (A) ...
  const optionsMap: { A: string; B: string; C: string; D: string } = {
    A: '',
    B: '',
    C: '',
    D: '',
  };

  let questionText = '';

  // Look for options in remainingBlock
  // We can search for option prefixes: (a) or (A) or A. or A)
  // Let's test if options are on separate lines or inline
  const inlineOptionRegex = /(?:\(|\b|-|\s)([a-d])(?:\)|\.|\s*-)\s+([^()]+?)(?=(?:\(|\b|-|\s)[a-d](?:\)|\.|\s*-)|$)/gi;
  
  // Or check line-by-line options
  const lines = remainingBlock.split('\n').map(l => l.trim()).filter(Boolean);
  const qLines: string[] = [];
  let currentOpt: CorrectOption | null = null;
  let optBuffer: string[] = [];

  for (const line of lines) {
    const optLineMatch = line.match(/^[-*•]?\s*\(?([a-d])(?:\)|\.|\s*[-–:])\s*(.*)$/i);
    if (optLineMatch) {
      if (currentOpt) {
        optionsMap[currentOpt] = cleanText(optBuffer.join(' '));
      }
      currentOpt = optLineMatch[1].toUpperCase() as CorrectOption;
      optBuffer = [optLineMatch[2] || ''];
    } else if (currentOpt) {
      // Continuation of current option or inline options
      // Check if this line contains inline options e.g. "(c) 1954-55 (d) 1953-54"
      const inlineMatches = [...line.matchAll(/\(?([a-d])\)\s*([^()]+)/gi)];
      if (inlineMatches.length > 1) {
        // multiple inline options on this line
        if (currentOpt && optBuffer.length > 0) {
          optionsMap[currentOpt] = cleanText(optBuffer.join(' '));
          currentOpt = null;
          optBuffer = [];
        }
        for (const m of inlineMatches) {
          const key = m[1].toUpperCase() as CorrectOption;
          optionsMap[key] = cleanText(m[2]);
        }
      } else {
        optBuffer.push(line);
      }
    } else {
      // Check if line itself contains all 4 inline options like "(a) ... (b) ... (c) ... (d) ..."
      const inlineMatches = [...line.matchAll(/\(?([a-d])\)\s*([^()]+)/gi)];
      if (inlineMatches.length >= 2) {
        for (const m of inlineMatches) {
          const key = m[1].toUpperCase() as CorrectOption;
          optionsMap[key] = cleanText(m[2]);
        }
      } else {
        qLines.push(line);
      }
    }
  }

  if (currentOpt && optBuffer.length > 0) {
    optionsMap[currentOpt] = cleanText(optBuffer.join(' '));
  }

  // Clean Question text
  questionText = qLines.join(' ');
  // Clean question prefix (e.g. "**1. Question?**" or "## Question 1")
  questionText = questionText
    .replace(/^##+\s*(?:Question\s*\d*[:.]?)?/i, '')
    .replace(/^\*\*\d+\.?\s*/, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/\*\*$/g, '')
    .trim();

  // Also clean exam tags that might be inside questionText
  if (examRef && questionText.includes(examRef)) {
    questionText = questionText.replace(examRef, '').trim();
  }

  // Also clean any option text that might have absorbed trailing exam refs
  (['A', 'B', 'C', 'D'] as CorrectOption[]).forEach(k => {
    if (examRef && optionsMap[k].includes(examRef)) {
      optionsMap[k] = optionsMap[k].replace(examRef, '').trim();
    }
    // Clean trailing bold or punctuation
    optionsMap[k] = cleanText(optionsMap[k]);
  });

  questionText = cleanText(questionText);

  // Validation checks:
  if (!questionText || questionText.length < 5) {
    issues.push({
      index,
      type: 'error',
      message: `Question #${index} has missing or empty question text.`,
      rawText: block.substring(0, 80),
    });
  }

  const missingOptions: string[] = [];
  if (!optionsMap.A) missingOptions.push('A');
  if (!optionsMap.B) missingOptions.push('B');
  if (!optionsMap.C) missingOptions.push('C');
  if (!optionsMap.D) missingOptions.push('D');

  if (missingOptions.length > 0) {
    issues.push({
      index,
      type: 'warning',
      message: `Question #${index} is missing option(s): ${missingOptions.join(', ')}.`,
      rawText: questionText.substring(0, 60),
    });
  }

  if (!correctAnswer) {
    issues.push({
      index,
      type: 'error',
      message: `Question #${index} has no identified correct answer (A, B, C, or D). Never silently guessed.`,
      rawText: questionText.substring(0, 60),
    });
  }

  // If question text is empty, we return null
  if (!questionText && missingOptions.length === 4) {
    return { question: null, issues };
  }

  const question: Question = {
    id: generateId(),
    question_text: questionText || `Question ${index}`,
    option_a: optionsMap.A || 'Option A',
    option_b: optionsMap.B || 'Option B',
    option_c: optionsMap.C || 'Option C',
    option_d: optionsMap.D || 'Option D',
    correct_answer: correctAnswer || 'A', // placeholder if missing, flagged in issues
    explanation: explanation || undefined,
    exam_reference: examRef || undefined,
  };

  return { question, issues };
}

/**
 * Extract text from PDF file using pdfjs-dist
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    // Dynamic import to keep bundle modular and handle browser workers cleanly
    const pdfjs = await import('pdfjs-dist');
    
    // Set worker source
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `\n\n--- Page ${pageNum} ---\n\n` + pageText;
    }

    return fullText;
  } catch (error) {
    console.error('PDF extraction failed:', error);
    throw new Error(
      error instanceof Error 
        ? `PDF Extraction failed: ${error.message}. If the PDF contains scanned images, text OCR is required.`
        : 'Failed to extract text from PDF.'
    );
  }
}
