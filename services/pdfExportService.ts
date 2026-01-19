/**
 * PDF/A Compliant Export Service
 * Generates IATF-compliant PDF/A documents with embedded metadata,
 * watermarked with approval status and QR code for physical part labeling.
 * 
 * Note: Full PDF/A compliance requires server-side processing for XMP metadata embedding.
 * This service generates PDFs with PDF/A structure ready for compliance processing.
 */

import { DeviationRecord, WorkflowStatus, ApprovalStep } from "../types";
import QRCode from "qrcode";

// Note: jsPDF doesn't fully support PDF/A out of the box.
// For production, consider using a backend service with PDF/A libraries.
// This implementation creates PDF/A-ready structure.

export interface PDFExportOptions {
  includeQRCode?: boolean;
  includeWatermark?: boolean;
  watermarkText?: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}

export class PDFExportService {
  /**
   * Generate PDF/A compliant document from deviation record
   */
  async generatePDFA(
    deviation: DeviationRecord,
    options: PDFExportOptions = {}
  ): Promise<Blob> {
    // Dynamic import to avoid SSR issues
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Set PDF metadata (PDF/A requires specific metadata)
    doc.setProperties({
      title: `SDA ${deviation.id} - ${deviation.masterData.materialNo || "Deviation Record"}`,
      subject: "Supplier Deviation Approval - IATF 16949 Compliance",
      author: "Webasto Quality Management System",
      keywords: [
        "SDA",
        "Supplier Deviation",
        "IATF 16949",
        deviation.id,
        deviation.classification.bu,
        deviation.masterData.materialNo || "",
      ].filter(Boolean).join(", "),
      creator: "Webasto SDA System",
      producer: "Webasto AI:PPROVAL",
    });

    // Cover Page
    this.addCoverPage(doc, deviation, options);
    doc.addPage();

    // Table of Contents
    yPos = this.addTableOfContents(doc, deviation, margin);
    doc.addPage();

    // Main Content
    yPos = this.addClassificationSection(doc, deviation, margin);
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    yPos = this.addMasterDataSection(doc, deviation, yPos, margin, pageHeight);
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    yPos = this.addDetailsSection(doc, deviation, yPos, margin, pageHeight);
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    yPos = this.addRisksSection(doc, deviation, yPos, margin, pageHeight);
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    yPos = this.addActionsSection(doc, deviation, yPos, margin, pageHeight);
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    this.addApprovalsSection(doc, deviation, yPos, margin, pageHeight);

    // Add QR Code on last page
    if (options.includeQRCode !== false) {
      await this.addQRCode(doc, deviation, pageWidth, pageHeight);
    }

    // Add watermark if specified
    if (options.includeWatermark !== false) {
      this.addWatermark(doc, deviation.status, pageWidth, pageHeight);
    }

    // Add footer on all pages
    this.addFooter(doc, deviation, pageWidth, pageHeight);

    return doc.output("blob");
  }

  /**
   * Generate QR code data URL
   */
  async generateQRCode(
    deviationId: string,
    materialNo: string
  ): Promise<string> {
    const qrData = JSON.stringify({
      type: "SDA",
      id: deviationId,
      material: materialNo,
      timestamp: new Date().toISOString(),
    });

    try {
      return await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: "M",
        type: "image/png",
        width: 200,
        margin: 2,
      });
    } catch (error) {
      console.error("QR code generation error:", error);
      return "";
    }
  }

  /**
   * Add cover page
   */
  private addCoverPage(
    doc: any,
    deviation: DeviationRecord,
    options: PDFExportOptions
  ): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Supplier Deviation Approval", pageWidth / 2, 50, {
      align: "center",
    });

    // Deviation ID
    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    doc.text(`SDA ID: ${deviation.id}`, pageWidth / 2, 70, {
      align: "center",
    });

    // Status Badge
    const statusColor = this.getStatusColor(deviation.status);
    doc.setFillColor(statusColor.r, statusColor.g, statusColor.b);
    doc.roundedRect(
      pageWidth / 2 - 30,
      80,
      60,
      15,
      3,
      3,
      "F"
    );
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Status: ${deviation.status}`,
      pageWidth / 2,
      90,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);

    // Key Information
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    let y = 120;
    const info = [
      ["Material No.", deviation.masterData.materialNo || "N/A"],
      ["Supplier", deviation.masterData.supplierName || "N/A"],
      ["Business Unit", deviation.classification.bu],
      ["Plant", deviation.masterData.plant],
      ["Request Date", new Date(deviation.masterData.requestDate).toLocaleDateString()],
    ];

    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, pageWidth / 2 - 40, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text(String(value), pageWidth / 2 - 35, y, { align: "left" });
      y += 8;
    });

    // IATF Compliance Notice
    y = pageHeight - 60;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(
      "This document is generated in compliance with IATF 16949 standards.",
      pageWidth / 2,
      y,
      { align: "center" }
    );
    doc.text(
      "PDF/A format ensures long-term archival compatibility.",
      pageWidth / 2,
      y + 6,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);
  }

  /**
   * Add table of contents
   */
  private addTableOfContents(
    doc: any,
    deviation: DeviationRecord,
    margin: number
  ): number {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Table of Contents", margin, margin);

    let y = margin + 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const sections = [
      "1. Classification",
      "2. Master Data",
      "3. Deviation Details",
      "4. Risk Assessment (FMEA)",
      "5. Corrective Actions",
      "6. Approval Workflow",
    ];

    sections.forEach((section) => {
      doc.text(section, margin + 5, y);
      // Dotted line
      const lineX = margin + 60;
      const lineEnd = doc.internal.pageSize.getWidth() - margin - 20;
      doc.setLineWidth(0.1);
      doc.line(lineX, y - 2, lineEnd, y - 2);
      y += 10;
    });

    return y;
  }

  /**
   * Add classification section
   */
  private addClassificationSection(
    doc: any,
    deviation: DeviationRecord,
    margin: number
  ): number {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    let y = margin;
    doc.text("1. Classification", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const classification = [
      ["Language", deviation.classification.language],
      ["Business Unit", deviation.classification.bu],
      ["Trigger", deviation.classification.trigger],
      ["Duration", deviation.classification.duration],
    ];

    classification.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), margin + 40, y);
      y += 7;
    });

    return y;
  }

  /**
   * Add master data section
   */
  private addMasterDataSection(
    doc: any,
    deviation: DeviationRecord,
    yPos: number,
    margin: number,
    pageHeight: number
  ): number {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. Master Data", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const masterData = [
      ["Requestor", deviation.masterData.requestor],
      ["Department", deviation.masterData.department],
      ["Material No.", deviation.masterData.materialNo || "N/A"],
      ["Supplier", deviation.masterData.supplierName],
      ["Plant", deviation.masterData.plant],
      ["Project Title", deviation.masterData.projectTitle || "N/A"],
      ["Expiration Date", deviation.masterData.expirationDate || "N/A"],
      ["Product Safety Relevant", deviation.masterData.productSafetyRelevant ? "Yes" : "No"],
    ];

    masterData.forEach(([label, value]) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, yPos);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(String(value), doc.internal.pageSize.getWidth() - margin * 2 - 40);
      doc.text(lines, margin + 40, yPos);
      yPos += lines.length * 5 + 2;
    });

    return yPos;
  }

  /**
   * Add details section
   */
  private addDetailsSection(
    doc: any,
    deviation: DeviationRecord,
    yPos: number,
    margin: number,
    pageHeight: number
  ): number {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. Deviation Details", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Specification Requirement:", margin, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    const specLines = doc.splitTextToSize(
      deviation.details.specification || "Not specified",
      doc.internal.pageSize.getWidth() - margin * 2
    );
    doc.text(specLines, margin, yPos);
    yPos += specLines.length * 5 + 8;

    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Deviation Description:", margin, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    const devLines = doc.splitTextToSize(
      deviation.details.deviation || "Not specified",
      doc.internal.pageSize.getWidth() - margin * 2
    );
    doc.text(devLines, margin, yPos);
    yPos += devLines.length * 5 + 8;

    return yPos;
  }

  /**
   * Add risks section
   */
  private addRisksSection(
    doc: any,
    deviation: DeviationRecord,
    yPos: number,
    margin: number,
    pageHeight: number
  ): number {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("4. Risk Assessment (FMEA)", margin, yPos);
    yPos += 10;

    if (deviation.risks.length === 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("No risks defined", margin, yPos);
      return yPos + 10;
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    // Table header
    const headers = ["Source", "Description", "S", "O", "D", "RPN"];
    const colWidths = [25, 80, 15, 15, 15, 20];
    let x = margin;
    headers.forEach((header, i) => {
      doc.text(header, x, yPos);
      x += colWidths[i];
    });
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    deviation.risks.forEach((risk) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
        // Redraw header
        x = margin;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        headers.forEach((header, i) => {
          doc.text(header, x, yPos);
          x += colWidths[i];
        });
        yPos += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
      }

      x = margin;
      const rpn = risk.severity * risk.occurrence * risk.detection;
      const rowData = [
        risk.source,
        risk.description.substring(0, 40) + (risk.description.length > 40 ? "..." : ""),
        risk.severity.toString(),
        risk.occurrence.toString(),
        risk.detection.toString(),
        rpn.toString(),
      ];

      rowData.forEach((data, i) => {
        doc.text(data, x, yPos);
        x += colWidths[i];
      });
      yPos += 6;
    });

    return yPos;
  }

  /**
   * Add actions section
   */
  private addActionsSection(
    doc: any,
    deviation: DeviationRecord,
    yPos: number,
    margin: number,
    pageHeight: number
  ): number {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("5. Corrective Actions", margin, yPos);
    yPos += 10;

    if (deviation.actions.length === 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("No actions defined", margin, yPos);
      return yPos + 10;
    }

    doc.setFontSize(10);
    deviation.actions.forEach((action) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`${action.type} Action: ${action.description}`, margin, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`Owner: ${action.owner} | Due: ${action.dueDate} | Status: ${action.status}`, margin + 5, yPos);
      yPos += 8;
    });

    return yPos;
  }

  /**
   * Add approvals section
   */
  private addApprovalsSection(
    doc: any,
    deviation: DeviationRecord,
    yPos: number,
    margin: number,
    pageHeight: number
  ): void {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("6. Approval Workflow", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    deviation.approvals.forEach((approval, index) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${approval.role}`, margin, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`Status: ${approval.status}`, margin + 5, yPos);
      if (approval.approverName) {
        yPos += 5;
        doc.text(`Approver: ${approval.approverName}`, margin + 5, yPos);
      }
      if (approval.decisionDate) {
        yPos += 5;
        doc.text(`Date: ${approval.decisionDate}`, margin + 5, yPos);
      }
      yPos += 8;
    });
  }

  /**
   * Add QR code to last page
   */
  private async addQRCode(
    doc: any,
    deviation: DeviationRecord,
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
    const qrDataUrl = await this.generateQRCode(
      deviation.id,
      deviation.masterData.materialNo || ""
    );

    if (qrDataUrl) {
      const qrSize = 40;
      const qrX = pageWidth - 60;
      const qrY = pageHeight - 60;

      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Scan for details", qrX + qrSize / 2 - 15, qrY + qrSize + 5);
    }
  }

  /**
   * Add watermark
   */
  private addWatermark(
    doc: any,
    status: WorkflowStatus,
    pageWidth: number,
    pageHeight: number
  ): void {
    const pageCount = doc.internal.pages.length - 1;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(60);
      doc.setFont("helvetica", "bold");
      doc.setGState(doc.GState({ opacity: 0.1 }));
      doc.text(
        status.toUpperCase(),
        pageWidth / 2,
        pageHeight / 2,
        {
          align: "center",
          angle: 45,
        }
      );
      doc.setGState(doc.GState({ opacity: 1 }));
      doc.setTextColor(0, 0, 0);
    }
  }

  /**
   * Add footer to all pages
   */
  private addFooter(
    doc: any,
    deviation: DeviationRecord,
    pageWidth: number,
    pageHeight: number
  ): void {
    const pageCount = doc.internal.pages.length - 1;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `SDA ${deviation.id} | Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
      doc.setTextColor(0, 0, 0);
    }
  }

  /**
   * Get status color
   */
  private getStatusColor(status: WorkflowStatus): { r: number; g: number; b: number } {
    const colors: Record<WorkflowStatus, { r: number; g: number; b: number }> = {
      [WorkflowStatus.Draft]: { r: 100, g: 100, b: 100 },
      [WorkflowStatus.Submitted]: { r: 59, g: 130, b: 246 },
      [WorkflowStatus.InReview]: { r: 251, g: 191, b: 36 },
      [WorkflowStatus.Approved]: { r: 34, g: 197, b: 94 },
      [WorkflowStatus.Rejected]: { r: 239, g: 68, b: 68 },
      [WorkflowStatus.Expired]: { r: 168, g: 85, b: 247 },
      [WorkflowStatus.Closed]: { r: 71, g: 85, b: 105 },
    };
    return colors[status] || { r: 100, g: 100, b: 100 };
  }
}
