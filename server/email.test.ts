/**
 * Email service unit tests
 * Tests the email helper functions without actually sending emails
 */
import { describe, it, expect, vi } from "vitest";
import { generateNewsletterHtml, generateContactConfirmationHtml, generateContactAdminHtml } from "./email";

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
    expect(html).toContain("猫眼增长引擎");
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

describe("generateContactConfirmationHtml", () => {
  it("should include visitor name in greeting", () => {
    const html = generateContactConfirmationHtml("张三", "ABC公司");
    expect(html).toContain("张三");
  });

  it("should include company name", () => {
    const html = generateContactConfirmationHtml("张三", "ABC公司");
    expect(html).toContain("ABC公司");
  });

  it("should include brand name", () => {
    const html = generateContactConfirmationHtml("张三", "ABC公司");
    expect(html).toContain("猫眼增长引擎");
  });

  it("should include response time promise", () => {
    const html = generateContactConfirmationHtml("张三", "ABC公司");
    expect(html).toContain("1-2");
  });

  it("should be valid HTML", () => {
    const html = generateContactConfirmationHtml("张三", "ABC公司");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });
});

describe("generateContactAdminHtml", () => {
  it("should include visitor name", () => {
    const html = generateContactAdminHtml("李四", "XYZ集团", "13800138000", "需要品牌诊断");
    expect(html).toContain("李四");
  });

  it("should include company name", () => {
    const html = generateContactAdminHtml("李四", "XYZ集团", "13800138000", "需要品牌诊断");
    expect(html).toContain("XYZ集团");
  });

  it("should include phone number", () => {
    const html = generateContactAdminHtml("李四", "XYZ集团", "13800138000", "需要品牌诊断");
    expect(html).toContain("13800138000");
  });

  it("should include message content", () => {
    const html = generateContactAdminHtml("李四", "XYZ集团", "13800138000", "需要品牌诊断");
    expect(html).toContain("需要品牌诊断");
  });

  it("should handle empty message gracefully", () => {
    const html = generateContactAdminHtml("李四", "XYZ集团", "13800138000", "");
    expect(html).toContain("（未填写）");
  });
});
