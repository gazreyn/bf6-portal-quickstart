import { Project, SyntaxKind } from "ts-morph";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";

const ENTRY = "src/main.ts";
const OUT = "dist/Script.ts";

// If you need to treat some packages as externals that Battlefield Portal provides,
// add them here so we keep their import statements.
const EXTERNALS = new Set<string>([]);

// Files to exclude from the bundle (like utility files that shouldn't be included)
const EXCLUDE_FILES = new Set<string>([
  "src/lib/string-macro.ts"
]);

// String extraction functionality
const strings = new Map<string, { id: string; value: string }>();
const stringPrefix = 'string_';

function generateStringId(value: string): string {
  const hash = crypto.createHash('md5').update(value).digest('hex');
  return stringPrefix + hash.substring(0, 12);
}

function extractStringsFromCode(code: string): string {
  // Match s`...` template literals, including those with escaped backticks
  const regex = /s`([^`]*(?:\\.[^`]*)*)`/g;
  
  let match;
  let transformedCode = code;
  const replacements: Array<{ original: string; replacement: string }> = [];

  while ((match = regex.exec(code)) !== null) {
    const fullMatch = match[0]; // s`text`
    const stringContent = match[1]; // text (inside backticks)
    
    // Unescape the string content
    let unescapedContent = stringContent
      .replace(/\\`/g, '`')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');

    // Strip variable names from template literal placeholders
    // Convert ${variableName} to ${}
    const normalizedContent = unescapedContent.replace(/\$\{[^}]+\}/g, '${}');

    // Generate or retrieve string ID
    let stringId: string;
    const existing = Array.from(strings.values()).find(entry => entry.value === normalizedContent);
    
    if (existing) {
      stringId = existing.id;
    } else {
      stringId = generateStringId(normalizedContent);
      strings.set(stringId, { id: stringId, value: normalizedContent });
    }

    // Replace s`text` with mod.stringkeys.string_xxxxx
    const replacement = `mod.stringkeys.${stringId}`;
    replacements.push({ original: fullMatch, replacement });
  }

  // Apply all replacements
  for (const { original, replacement } of replacements) {
    transformedCode = transformedCode.replace(original, replacement);
  }

  return transformedCode;
}

async function main() {
  const project = new Project({
    tsConfigFilePath: "tsconfig.json",
    // Ensure we load all src files, not only those TS thinks are referenced
    skipAddingFilesFromTsConfig: false,
  });

  const entry = project.getSourceFile(ENTRY);
  if (!entry) throw new Error(`Entry not found: ${ENTRY}`);

  const ordered = topoOrder(entry);
  const pieces: string[] = [];

  for (const sf of ordered) {
    // Skip excluded files
    const relativePath = path.relative(process.cwd(), sf.getFilePath());
    if (EXCLUDE_FILES.has(relativePath.replace(/\\/g, '/'))) {
      continue;
    }

    // Remove import declarations for local files. Keep externals.
    for (const imp of sf.getImportDeclarations()) {
      const isLocal =
        !!imp.getModuleSpecifierSourceFile() &&
        !EXTERNALS.has(imp.getModuleSpecifierValue());
      if (isLocal) {
        // If it is "type-only" import, safe to drop.
        // If it's value import, we rely on inlined symbols being in scope.
        imp.remove();
      }
    }

    // Flatten re-exports like `export { x } from './y'`
    for (const ex of sf.getExportDeclarations()) {
      const target = ex.getModuleSpecifierSourceFile();
      if (target) {
        // Replace with in-file export to keep symbol visibility
        const named = ex.getNamedExports();
        if (named.length) {
          pieces.push(
            `// Re-export from ${path.relative(process.cwd(), target.getFilePath())}\n` +
              named.map(n => `export { ${n.getName()} };`).join("\n")
          );
        }
        ex.remove();
      } else {
        // `export { a, b }` stays as-is
      }
    }

    // Drop "export" keywords on top-level declarations to keep them as plain symbols.
    // Exception: Keep export on functions in main.ts
    const isMainFile = path.basename(sf.getFilePath()) === 'main.ts';
    
    for (const statement of sf.getStatements()) {
      if (statement.getKind() === SyntaxKind.FunctionDeclaration || 
          statement.getKind() === SyntaxKind.ClassDeclaration ||
          statement.getKind() === SyntaxKind.VariableStatement ||
          statement.getKind() === SyntaxKind.InterfaceDeclaration ||
          statement.getKind() === SyntaxKind.TypeAliasDeclaration) {
        
        // Cast to a type that has modifiers
        const declarationNode = statement as any;
        if (declarationNode.getModifiers) {
          const modifiers = declarationNode.getModifiers();
          const exportModifier = modifiers.find((mod: any) => mod.getKind() === SyntaxKind.ExportKeyword);
          if (exportModifier) {
            // Keep export on functions in main.ts, remove from others
            const shouldKeepExport = isMainFile && statement.getKind() === SyntaxKind.FunctionDeclaration;
            
            if (!shouldKeepExport) {
              // Remove the export modifier by replacing the text
              const text = statement.getText();
              const newText = text.replace(/^export\s+/, '');
              statement.replaceWithText(newText);
            }
          }
        }
      }
    }

    // Convert `export default` to a const with a stable name
    sf.getDescendantsOfKind(SyntaxKind.ExportAssignment).forEach(exp => {
      const expr = exp.getExpression().getText();
      const name = inferDefaultName(sf.getBaseNameWithoutExtension());
      exp.replaceWithText(`const ${name} = ${expr};`);
    });

    // Get the text and manually remove any remaining local imports
    let fileText = sf.getFullText();
    
    // Remove any remaining import statements for local files
    fileText = fileText.replace(/import\s+.*?from\s+['"]\..*?['"];?\s*/g, '');
    
    // Remove any remaining export keywords from declarations, except functions in main.ts
    if (isMainFile) {
      // For main.ts: Remove exports from non-function declarations only
      fileText = fileText.replace(/^export\s+(class|const|let|var|interface|type)/gm, '$1');
    } else {
      // For other files: Remove all export keywords
      fileText = fileText.replace(/^export\s+(function|class|const|let|var|interface|type)/gm, '$1');
    }
    
    // Extract strings and replace s`...` calls from the processed text
    fileText = extractStringsFromCode(fileText);

    // Add a banner per file for readability and use processed text
    pieces.push(
      `\n// ===== File: ${path.relative(process.cwd(), sf.getFilePath())} =====\n` +
        fileText
    );
  }

  // Optional: Prepend a generated header
  const header = ``;

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, header + pieces.join("\n"));
  
  // Generate strings.json file
  if (strings.size > 0) {
    const stringsObject: Record<string, string> = {};
    for (const [id, entry] of strings.entries()) {
      stringsObject[id] = entry.value;
    }
    
    await fs.writeFile(
      path.join(path.dirname(OUT), 'Strings.json'),
      JSON.stringify(stringsObject, null, 2),
      'utf-8'
    );
    console.log(`✓ Extracted ${strings.size} strings to ${path.dirname(OUT)}/Strings.json`);
  }
  
  console.log(`Wrote ${OUT}`);
}

function topoOrder(entry: import("ts-morph").SourceFile) {
  const seen = new Set<string>();
  const ordered: import("ts-morph").SourceFile[] = [];

  function visit(sf: import("ts-morph").SourceFile) {
    const id = sf.getFilePath();
    if (seen.has(id)) return;
    seen.add(id);

    // Recurse imports first
    for (const imp of sf.getImportDeclarations()) {
      const dep = imp.getModuleSpecifierSourceFile();
      if (dep) visit(dep);
    }
    ordered.push(sf);
  }

  visit(entry);
  return ordered;
}

function inferDefaultName(base: string) {
  // index -> module name from folder, else filename
  if (base === "index") return "defaultExport";
  return `${base}Default`;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
