import { describe, expect, it } from "vitest";
import { parseBunnyVideoId } from "./video";

describe("parseBunnyVideoId", () => {
  it("passes a raw id through untouched", () => {
    expect(parseBunnyVideoId("abc-123-XYZ_456")).toBe("abc-123-XYZ_456");
    expect(parseBunnyVideoId("  d4f8e2a1-9b7c-4d5e-8f10-112233445566  ")).toBe("d4f8e2a1-9b7c-4d5e-8f10-112233445566");
  });

  it("extracts the id from CDN paths containing /videos/", () => {
    expect(parseBunnyVideoId("https://videojs.bunnycdn.com/iframe/xyz/videos/aaaa-bbbb-cccc")).toBe("aaaa-bbbb-cccc");
    expect(parseBunnyVideoId("https://example.com/videos/vid-001?token=secret")).toBe("vid-001");
  });

  it("extracts the id from /embed/ and /video/ paths", () => {
    expect(parseBunnyVideoId("https://iframe.delivery/embed/12345678")).toBe("12345678");
    expect(parseBunnyVideoId("https://player.example.com/video/vid-009")).toBe("vid-009");
  });

  it("extracts the id from playlist account paths", () => {
    expect(parseBunnyVideoId("https://videojs.bunnycdn.com/playlist/123456/video/vid-777")).toBe("vid-777");
  });

  it("extracts the id from query parameters", () => {
    expect(parseBunnyVideoId("https://iframe.delivery/player?videoId=vid-42&t=1")).toBe("vid-42");
    expect(parseBunnyVideoId("https://example.com/watch?videoGuid=vid-43")).toBe("vid-43");
    expect(parseBunnyVideoId("https://example.com/watch?guid=vid-44")).toBe("vid-44");
  });

  it("rejects inputs without a recognizable id", () => {
    expect(parseBunnyVideoId("")).toBeNull();
    expect(parseBunnyVideoId("   ")).toBeNull();
    expect(parseBunnyVideoId(null)).toBeNull();
    expect(parseBunnyVideoId(42)).toBeNull();
    expect(parseBunnyVideoId("https://example.com/page/about")).toBeNull();
    expect(parseBunnyVideoId("https://example.com/videos/short")).toBeNull(); // shorter than 6 chars
    expect(parseBunnyVideoId("not a url nor an id!")).toBeNull();
  });
});
