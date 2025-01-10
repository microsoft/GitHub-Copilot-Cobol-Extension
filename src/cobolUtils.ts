import { isNullOrEmpty } from "./utils";

export function isCobolProgram(content: string): boolean {
  return content.includes("IDENTIFICATION DIVISION");
}
export interface CobolParagraph {
  paragraphName: string;
  content: string[];
}

export interface CobolSection {
  sectionName: string;
  content: string[];
  paragraphs: CobolParagraph[];
}

export interface CobolDivision {
  divisionName: string;
  sections: CobolSection[];
  content: string[];
}

export function chunkCobolCode(sourceCode: string): CobolDivision[] {
  const divisions: CobolDivision[] = [];
  let currentDivision: CobolDivision | null = null;
  let currentSection: CobolSection | null = null;
  let currentParagraph: CobolParagraph | null = null;

  const divisionPattern =
    /^(?!\*)\s*(?:\b\w{0,6}\b\s*)?(.*?)(?=\sDIVISION\s*(\.|USING))/i;
  const sectionPattern = /^(?!\*)\s*(?:\b\w{0,6}\b\s*)?(.*?)\s*SECTION\./i;
  const paragraphPattern =
    /^(?!\*)\s*(?:[\w]+ )?([\w]+(?:-[A-Z]+)*)\.(?<!EXIT\.|END-EXEC\.)$/i;

  currentDivision = {
    divisionName: "HEADER",
    content: [],
    sections: [],
  };

  const lines = sourceCode.split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();
    try {
      // Check for a new division
      const divisionMatch = trimmedLine.match(divisionPattern);
      if (divisionMatch) {
        let divisionName = divisionMatch[1];
        if (isNullOrEmpty(divisionName)) {
          divisionName = divisionMatch[0];
        }
        // Save the previous paragraph, section, and division
        if (currentParagraph && currentSection) {
          currentSection.paragraphs.push(currentParagraph);
        }
        if (currentSection && currentDivision) {
          currentDivision.sections.push(currentSection);
        }
        if (currentDivision) {
          divisions.push(currentDivision);
        }

        // Start a new division
        currentDivision = {
          divisionName: divisionName,
          sections: [],
          content: [line],
        };
        currentSection = {
          sectionName: "MAIN",
          content: [],
          paragraphs: [],
        };
        currentParagraph = {
          paragraphName: "MAIN",
          content: [],
        };
        continue;
      }

      // Check for a new section
      const sectionMatch = trimmedLine.match(sectionPattern);
      if (sectionMatch) {
        // Save the previous paragraph and section
        if (currentParagraph && currentSection) {
          currentSection.paragraphs.push(currentParagraph);
        }
        if (currentSection && currentDivision) {
          currentDivision.sections.push(currentSection);
        }

        // Start a new section
        currentSection = {
          sectionName: sectionMatch[1],
          content: [line],
          paragraphs: [],
        };
        currentParagraph = {
          paragraphName: "MAIN",
          content: [],
        };
        continue;
      }

      // Check for a new paragraph
      const paragraphMatch = trimmedLine.match(paragraphPattern);

      if (paragraphMatch) {
        // Save the previous paragraph
        if (!currentSection) {
          currentSection = {
            sectionName: "MAIN",
            content: [],
            paragraphs: [],
          };
        }
        if (currentParagraph && currentSection) {
          currentSection.paragraphs.push(currentParagraph);
        }

        // Start a new paragraph
        currentParagraph = {
          paragraphName: paragraphMatch[1],
          content: [],
        };

        continue;
      }

      // Append the line to the current paragraph, section, or division
      if (
        currentParagraph &&
        currentParagraph?.content &&
        (currentParagraph.content.length >= 100 ||
          (currentParagraph.content.length > 80 &&
            (trimmedLine.startsWith("*") || /^\w{0,6}\b\*/.test(trimmedLine))))
      ) {
        if (!currentSection) {
          currentSection = {
            sectionName: "MAIN",
            content: [],
            paragraphs: [],
          };
        }
        currentSection.paragraphs.push(currentParagraph);
        currentParagraph = {
          paragraphName: currentParagraph.paragraphName,
          content: [line],
        };
      }
      if (currentParagraph) {
        currentParagraph.content.push(line);
      } else if (currentSection) {
        currentSection.content.push(line);
      } else if (currentDivision) {
        currentDivision.content.push(line);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Add the last paragraph, section, and division
  if (currentParagraph && currentSection) {
    currentSection.paragraphs.push(currentParagraph);
  }
  if (currentSection && currentDivision) {
    currentDivision.sections.push(currentSection);
  }
  if (currentDivision) {
    divisions.push(currentDivision);
  }

  return divisions;
}
