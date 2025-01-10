import * as fs from "fs";
import * as crypto from "crypto";

export function calculateFileSHA(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => {
      hash.update(data);
    });

    stream.on("end", () => {
      const sha = hash.digest("hex");
      resolve(sha);
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
}
export function isNullOrEmpty(value: string): boolean {
  if (value === null || value === undefined) {
    return true;
  } else if (value.trim().length === 0 && !value.includes("\n")) {
    return true;
  } else {
    return false;
  }
}
