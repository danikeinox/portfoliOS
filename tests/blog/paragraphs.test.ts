import { describe, expect, it } from "vitest";
import { splitBlogParagraphs } from "@/lib/blog";

describe("splitBlogParagraphs", () => {
  it("splits on blank lines", () => {
    expect(splitBlogParagraphs("Uno.\n\nDos.")).toEqual(["Uno.", "Dos."]);
  });

  it("trims and drops empty segments", () => {
    expect(splitBlogParagraphs("\n\nHola\n\n\nMundo\n")).toEqual(["Hola", "Mundo"]);
  });

  it("keeps single newlines inside a paragraph", () => {
    expect(splitBlogParagraphs("Linea A\nLinea B\n\nSiguiente")).toEqual([
      "Linea A\nLinea B",
      "Siguiente",
    ]);
  });
});
