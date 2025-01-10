import path from "path";
import * as fs from "fs";
import * as vscode from "vscode";
import { CobolDivision, CobolSection, CobolParagraph } from "./cobolUtils";
import {
  systemPrompt,
  headerInfoPrompt,
  procedureSectionPrompt,
  dataSectionPrompt,
  explainCodePrompt,
} from "./prompts";

export async function generateDocumentation(
  currentFile: string,
  docContent: string,
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream
) {
  let targetFolder: string;
  if (path.isAbsolute(request.prompt)) {
    targetFolder = request.prompt;
  } else {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      targetFolder = path.dirname(currentFile);
    } else {
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      targetFolder = path.join(workspaceRoot, "docs");
    }
  }

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  const fileName =
    path.basename(currentFile, path.extname(currentFile)) + ".md";
  const docPath = path.join(targetFolder, fileName);
  const docUri = vscode.Uri.file(docPath);


    try {
      await vscode.workspace.fs.writeFile(docUri, Buffer.from(docContent));
      stream.markdown(
        `\n\nDocument generated: \n[${docPath}](${docUri.toString()})`
      );
    } catch (error: unknown) {
      const errorMessage = (error as Error).message;
      stream.markdown(`\n\nFailed to generate document: \n${errorMessage}`);
    }
}

export async function* processHeaderDivisions(
  divisions: CobolDivision[],
  stream: vscode.ChatResponseStream,
  request: vscode.ChatRequest,
  token: vscode.CancellationToken
) {
  let code = "";
  for (const division of divisions) {
    if (
      division.divisionName === "HEADER" ||
      division.divisionName === "IDENTIFICATION" ||
      division.divisionName === "ENVIRONMENT"
    ) {
      stream.progress("Processing division: " + division.divisionName);

      code += division.content.join("\n");
      division.sections.forEach((section) => {
        code += section.content.join("\n");
        section.paragraphs.forEach((paragraph) => {
          code += paragraph.content.join("\n");
        });
      });
    }
  }

  const prompt = headerInfoPrompt.replace("{{code}}", code);
  const msgs = [
    vscode.LanguageModelChatMessage.Assistant(systemPrompt),
    vscode.LanguageModelChatMessage.User(prompt),
  ];
  const result = await request.model.sendRequest(msgs, {}, token);
  for await (const fragment of result.text) {
    yield fragment;
  }
}

export async function* processDataDivision(
  division: CobolDivision,
  stream: vscode.ChatResponseStream,
  request: vscode.ChatRequest,
  token: vscode.CancellationToken
) {
  stream.progress(`Analyzing division ${division.divisionName}`);
  for (const section of division.sections) {
    if (section.content.length > 0) {
      yield `\n### ${section.sectionName} SECTION\n`;
      for await (const fragment of processDataSections(
        section,
        stream,
        request,
        token
      )) {
        yield fragment;
      }
    }
  }
}

export async function* processProcedureDivision(
  division: CobolDivision,
  stream: vscode.ChatResponseStream,
  request: vscode.ChatRequest,
  token: vscode.CancellationToken
) {
  stream.progress(`Analyzing division ${division.divisionName}`);

  for (const section of division.sections) {
    for await (const fragment of processProcedureSection(
      section,
      stream,
      request,
      token
    )) {
      yield fragment;
    }
  }
}

export async function* processProcedureSection(
  section: CobolSection,
  stream: vscode.ChatResponseStream,
  request: vscode.ChatRequest,
  token: vscode.CancellationToken
) {
  stream.progress(`Analyzing section ${section.sectionName}`);
  const content = section.content.join("\n");
  section.paragraphs.forEach((paragraph) => {
    content.concat(paragraph.content.join("\n"));
  });

  let prompt = procedureSectionPrompt.replace("{{code}}", content);
  if (section.sectionName !== "MAIN") {
    const sectionTitle = `\n  ### ${section.sectionName} \n  `;
    if (prompt.includes("{{paragraph_name}}")) {
      prompt = prompt.replace("{{paragraph_name}}", section.sectionName);
      yield sectionTitle;
    }
  }
  for (const paragraph of section.paragraphs) {
    if (paragraph.content.length > 0) {
      for await (const fragment of processParagraph(
        paragraph,
        systemPrompt,
        prompt,
        stream,
        request,
        token
      )) {
        yield fragment;
      }
    }
  }
}

export async function* processDataSections(
  section: CobolSection,
  stream: vscode.ChatResponseStream,
  request: vscode.ChatRequest,
  token: vscode.CancellationToken
) {
  stream.progress(`Analyzing ${section.sectionName} SECTION`);

  const prompt = dataSectionPrompt;

  for (const paragraph of section.paragraphs) {
    if (paragraph.content.length > 0) {
      for await (const fragment of processParagraph(
        paragraph,
        systemPrompt,
        prompt,
        stream,
        request,
        token
      )) {
        yield fragment;
      }
    }
  }
}

export async function* processParagraph(
  paragraph: CobolParagraph,
  systemPrompt: string,
  userPrompt: string,
  stream: vscode.ChatResponseStream,
  request: vscode.ChatRequest,
  token: vscode.CancellationToken
) {
  const content = paragraph.content.join("\n");
  let prompt = userPrompt.replace("{{code}}", content);
  prompt = prompt.replace("{{paragraph_name}}", paragraph.paragraphName);
  yield `  \n`;
  const msgs = [
    vscode.LanguageModelChatMessage.Assistant(systemPrompt),
    vscode.LanguageModelChatMessage.User(prompt),
  ];

  const result = await request.model.sendRequest(msgs, {}, token);
  for await (const fragment of result.text) {
    yield fragment;
  }
}

export async function explainCode(
  code: string,
  stream: vscode.ChatResponseStream,
  request: vscode.ChatRequest,
  token: vscode.CancellationToken
) {
  stream.progress(`Analyzing code...`);
  const prompt = explainCodePrompt.replace("{{code}}", code);

  const msgs = [
    vscode.LanguageModelChatMessage.Assistant(systemPrompt),
    vscode.LanguageModelChatMessage.User(prompt),
  ];
  let contentResult = "";
  const result = await request.model.sendRequest(msgs, {}, token);
  for await (const fragment of result.text) {
    stream.markdown(fragment);
    contentResult += fragment;
  }
  return contentResult;
}
