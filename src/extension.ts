import * as path from "path";
import * as vscode from "vscode";
import { isCobolProgram, chunkCobolCode, CobolDivision } from "./cobolUtils";
import { calculateFileSHA, isNullOrEmpty } from "./utils";
import {
  explainCode,
  generateDocumentation,
  processDataDivision,
  processHeaderDivisions,
  processProcedureDivision,
} from "./functions";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Cache = require("vscode-cache");

export function activate(context: vscode.ExtensionContext) {
  const cache = new Cache(context);
  // define a chat handler
  const handler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ) => {
    const currentFile = vscode.window.activeTextEditor?.document.uri.fsPath;

    if (!currentFile) {
      stream.markdown("No active file found.");
      return;
    }

    let divisions: CobolDivision[] = [];
    try {
      const currentFileSHA = await calculateFileSHA(currentFile);
      const currentFileName = path.basename(currentFile);
      const content = vscode.window.activeTextEditor?.document.getText() ?? "";

      if (!content) {
        stream.markdown("The active file is empty.");
        return;
      }

      stream.progress("Checking file content...");
      if (!isCobolProgram(content)) {
        const code = await explainCode(content, stream, request, token);
        stream.markdown(code);
        return;
      }

      const infoCache = `${currentFileName}_${currentFileSHA}_info`;
      let cobolInfo: string = cache.get(infoCache) || "";

      const dataCache = `${currentFileName}_${currentFileSHA}_data`;
      let cobolData: string = cache.get(dataCache) || "";

      const procedureCache = `${currentFileName}_${currentFileSHA}_procedure`;
      let cobolProcedure: string = cache.get(procedureCache) || "";

      stream.progress(`Analyzing ${currentFileName}...`);
      const divisionCache = `${currentFileName}_${currentFileSHA}_divisions`;
      if (!cache.has(divisionCache)) {
        // Get the chunks for each division
        divisions = chunkCobolCode(content);
        cache.put(divisionCache, divisions);
      } else {
        divisions = cache.get(divisionCache);
      }
      /**/
      divisions = chunkCobolCode(content);

      switch (request.command) {
        case "info":
          stream.progress("Processing Info...");
          if (isNullOrEmpty(cobolInfo)) {
            for await (const fragment of processHeaderDivisions(
              divisions,
              stream,
              request,
              token
            )) {
              if (isNullOrEmpty(cobolInfo)) {
                stream.markdown(
                  "below the info extracted form your code: \n\n"
                );
              }
              stream.markdown(fragment);
              cobolInfo += fragment;
            }
            cache.put(infoCache, cobolInfo, 600);
          } else {
            stream.markdown("below the info extracted form your code: \n\n");
            cobolInfo.split(" ").forEach((word) => {
              stream.markdown(word + " ");
            });
          }
          break;
        case "procedure":
          stream.progress("Processing Procedures...");
          if (isNullOrEmpty(cobolProcedure)) {
            const procedureDivision = divisions.find(
              (d) => d.divisionName === "PROCEDURE"
            );
            if (procedureDivision) {
              for await (const fragment of processProcedureDivision(
                procedureDivision,
                stream,
                request,
                token
              )) {
                if (isNullOrEmpty(cobolProcedure)) {
                  stream.markdown(
                    "below the procedures list extracted form your code: \n\n## PROCEDURE SECTION\n"
                  );
                }
                stream.markdown(fragment);
                cobolProcedure += fragment;
              }
            }
            cache.put(procedureCache, cobolProcedure, 600);
          } else {
            stream.markdown(
              "below the procedures list extracted form your code: \n\n## PROCEDURE SECTION\n"
            );
            cobolProcedure.split(" ").forEach((word) => {
              stream.markdown(word + " ");
            });
          }

          break;
        case "data":
          stream.progress("Processing Data Info...");

          if (isNullOrEmpty(cobolData)) {
            const dataDivision = divisions.find(
              (d) => d.divisionName === "DATA"
            );
            if (dataDivision) {
              for await (const fragment of processDataDivision(
                dataDivision,
                stream,
                request,
                token
              )) {
                if (isNullOrEmpty(cobolData)) {
                  stream.markdown(
                    "below the variables, constants and labels for each section: \n\n"
                  );
                }
                cobolData += fragment;
                stream.markdown(fragment);
              }
            }
            cache.put(dataCache, cobolData, 600);
          } else {
            stream.markdown(
              "below the variables, constants and labels for each section: \n\n"
            );
            cobolData.split(" ").forEach((word) => {
              stream.markdown(word + " ");
            });
          }
          break;

        case "explain":
        case "gendoc": {
          const totalLines = content.split("\n").length;
          const isLargeFile = totalLines > 500;
          if (isLargeFile) {
            stream.progress(
              "File is large, please wait while processing the document..."
            );
          }

          let docContent = `# ${currentFileName}\n`;
          if (request.command !== "gendoc") {
            stream.markdown(`# ${currentFileName}\n`);
          }
          docContent += "## PROGRAM INFO\n";
          if (request.command !== "gendoc") {
            stream.markdown("## PROGRAM INFO\n");
          }
          //INFO
          stream.progress("Processing Info...");

          if (isNullOrEmpty(cobolInfo)) {
            for await (const fragment of processHeaderDivisions(
              divisions,
              stream,
              request,
              token
            )) {
              if (request.command !== "gendoc") {
                stream.markdown(fragment);
              }
              cobolInfo += fragment;
            }
            cache.put(infoCache, cobolInfo, 600);
          } else {
            if (request.command !== "gendoc") {
              cobolInfo.split(" ").forEach((word) => {
                stream.markdown(word + " ");
              });
            }
          }
          docContent += cobolInfo;
          docContent += "\n\n## DATA DIVISION\n";
          if (request.command !== "gendoc") {
            stream.markdown("\n\n## DATA DIVISION\n");
          }
          //DATA
          stream.progress("Processing Data Info...");
          if (isNullOrEmpty(cobolData)) {
            if (isLargeFile) {
              await new Promise((resolve) => setTimeout(resolve, 200));
            }

            const dataDivision = divisions.find(
              (d) => d.divisionName === "DATA"
            );
            if (dataDivision) {
              for await (const fragment of processDataDivision(
                dataDivision,
                stream,
                request,
                token
              )) {
                cobolData += fragment;
                if (request.command !== "gendoc") {
                  stream.markdown(fragment);
                }
              }
            }
            cache.put(dataCache, cobolData, 600);
          } else {
            if (request.command !== "gendoc") {
              cobolData.split(" ").forEach((word) => {
                stream.markdown(word + " ");
              });
            }
          }
          docContent += cobolData;
          docContent += "\n\n## PROCEDURE DIVISION\n";
          if (request.command !== "gendoc") {
            stream.markdown("\n\n## PROCEDURE DIVISION\n");
          }
          //PROCEDURE
          stream.progress("Processing Procedures...");
          if (isNullOrEmpty(cobolProcedure)) {
            const procedureDivision = divisions.find(
              (d) => d.divisionName === "PROCEDURE"
            );
            if (procedureDivision) {
              if (isLargeFile) {
                await new Promise((resolve) => setTimeout(resolve, 200));
              }
              for await (const fragment of processProcedureDivision(
                procedureDivision,
                stream,
                request,
                token
              )) {
                if (request.command !== "gendoc") {
                  stream.markdown(fragment);
                }
                cobolProcedure += fragment;
              }
            }
            cache.put(procedureCache, cobolProcedure, 600);
          } else {
            if (request.command !== "gendoc") {
              cobolProcedure.split(" ").forEach((word) => {
                stream.markdown(word + " ");
              });
            }
          }
          docContent += cobolProcedure;
          if (request.command === "gendoc") {
            //add code
            docContent += "\n\n## SOURCE CODE\n";
            docContent += "```cobol\n";
            docContent += content;
            docContent += "\n```\n";
            await generateDocumentation(
              currentFile,
              docContent,
              request,
              stream
            );
          }
          break;
        }

        default:
          stream.markdown("Sorry, i cannot assist you, invalid command");
          return;
      }
    } catch (error) {
      stream.markdown(`An error occurred: ${(error as Error).message}`);
    }
  };

  // create participant
  const tutor = vscode.chat.createChatParticipant(
    "microsoft.cobol-sample-agent",
    handler
  );

  // add icon to participant
  tutor.iconPath = vscode.Uri.joinPath(context.extensionUri, "logo.png");
}

export function deactivate() {}
