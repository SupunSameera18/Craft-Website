#!/usr/bin/env node
// Stitches partials/*.html into pages/*.html templates and writes the
// result to the repo root — those root files are what GitHub Pages
// actually serves (legacy branch deploy, no CI build step). Run this
// after editing anything in pages/ or partials/, then commit the result.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PAGES_DIR = path.join(ROOT, "pages");
const PARTIALS_DIR = path.join(ROOT, "partials");

const INCLUDE_RE = /^([ \t]*)<!--@include ([\w-]+)-->[ \t]*$/gm;

function readPartial(name) {
  const file = path.join(PARTIALS_DIR, name + ".html");
  if (!fs.existsSync(file)) {
    throw new Error(`Unknown partial "${name}" (looked for ${file})`);
  }
  return fs.readFileSync(file, "utf8").replace(/\n$/, "");
}

function indentBlock(block, indent) {
  if (!indent) return block;
  return block
    .split("\n")
    .map((line) => (line.length ? indent + line : line))
    .join("\n");
}

function build() {
  const pageFiles = fs
    .readdirSync(PAGES_DIR)
    .filter((f) => f.endsWith(".html"));

  for (const file of pageFiles) {
    const srcPath = path.join(PAGES_DIR, file);
    const template = fs.readFileSync(srcPath, "utf8");

    const output = template.replace(INCLUDE_RE, (_match, indent, name) => {
      const partial = readPartial(name);
      return indentBlock(partial, indent);
    });

    const outPath = path.join(ROOT, file);
    fs.writeFileSync(outPath, output, "utf8");
    console.log(`built ${file}`);
  }
}

build();
