import { describe, it, expect } from "vitest";
import { defaultAspectFor, defaultPurposeFor } from "@/lib/prompt/photoTypes";

describe("defaultPurposeFor", () => {
  it("packshot domyślnie celuje w sklep", () => {
    expect(defaultPurposeFor("packshot")).toBe("sklep");
  });
  it("mama_dziecko domyślnie celuje w instagram", () => {
    expect(defaultPurposeFor("mama_dziecko")).toBe("instagram");
  });
});

describe("defaultAspectFor", () => {
  it("stories zawsze daje pionowy 9:16", () => {
    expect(defaultAspectFor("stories", "lifestyle")).toBe("9:16");
  });
  it("meta_ads daje 4:5", () => {
    expect(defaultAspectFor("meta_ads", "packshot")).toBe("4:5");
  });
  it("banner daje poziomy", () => {
    expect(defaultAspectFor("banner", "lifestyle")).toBe("poziomy");
  });
  it("sklep daje 1:1", () => {
    expect(defaultAspectFor("sklep", "packshot")).toBe("1:1");
  });
});
