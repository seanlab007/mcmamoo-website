/**
 * Email service unit tests
 * Tests the email helper functions without actually sending emails
 */
import { describe, it, expect, vi } from "vitest";
import { generateNewsletterHtml } from "./email";

describe("generateNewsletterHtml", () => {
  it("should include the subject in the HTML output", () => {
    const html = generateNewsletterHtml("测试主题", "测试内容");
    expect(html).toContain("测试主题");
  });

  it("should include the content in the HTML output", () => {
    const html = generateNewsletterHtml("主题", "这是正文内容");
    expect(html).toContain("这是正文内容");
  });

  it("should include brand name", () => {
    const html = generateNewsletterHtml("主题", "内容");
    expect(html).toContain("猫眼咨询");
  });

  it("should include unsubscribe notice", () => {
    const html = generateNewsletterHtml("主题", "内容");
    expect(html).toContain("退订");
  });

  it("should include website link", () => {
    const html = generateNewsletterHtml("主题", "内容");
    expect(html).toContain("mcmamoo.com");
  });

  it("should convert newlines to <br/> tags", () => {
    const html = generateNewsletterHtml("主题", "第一行\n第二行");
    expect(html).toContain("第一行<br/>第二行");
  });

  it("should return valid HTML structure", () => {
    const html = generateNewsletterHtml("主题", "内容");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });
});
