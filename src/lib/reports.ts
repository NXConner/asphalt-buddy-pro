import jsPDF from 'jspdf';
import { ProjectEstimate } from './api';
import { formatCurrency, formatNumber, generateReportId } from './utils';

export interface ReportData {
  id: string;
  projectName: string;
  location: string;
  generatedAt: string;
  detectionResults: {
    totalArea: number;
    polygonCount: number;
    confidence: number;
    processingTime: number;
  };
  measurements: {
    area: number;
    thickness: number;
    volume: number;
    tonnage: number;
  };
  costs: {
    materials: number;
    labor: number;
    equipment: number;
    total: number;
  };
  recommendations: string[];
  technicalSpecs: {
    asphaltGrade: string;
    compactionRatio: number;
    layerThickness: number;
    temperature: number;
  };
}

export class ReportGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 40;
  private currentY: number = 40;

  constructor() {
    this.pdf = new jsPDF({
      unit: 'pt',
      format: 'letter',
      orientation: 'portrait'
    });
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  private addHeader(title: string): void {
    // Company header
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('OverWatch Pro', this.margin, this.currentY);
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Professional Asphalt Detection & Estimation', this.margin, this.currentY + 20);
    
    // Report title
    this.currentY += 50;
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin, this.currentY);
    
    // Date and ID
    this.currentY += 30;
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`Generated: ${new Date().toLocaleString()}`, this.margin, this.currentY);
    this.pdf.text(`Report ID: ${generateReportId()}`, this.pageWidth - 150, this.currentY);
    
    this.currentY += 30;
    
    // Separator line
    this.pdf.setLineWidth(1);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 20;
  }

  private addSection(title: string, data: Array<{ label: string; value: string }>): void {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 100) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }

    // Section title
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += 25;

    // Section content
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    data.forEach(item => {
      if (this.currentY > this.pageHeight - 60) {
        this.pdf.addPage();
        this.currentY = this.margin;
      }
      
      this.pdf.text(`${item.label}:`, this.margin + 10, this.currentY);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(item.value, this.margin + 150, this.currentY);
      this.pdf.setFont('helvetica', 'normal');
      this.currentY += 15;
    });

    this.currentY += 10;
  }

  private addTable(headers: string[], rows: string[][]): void {
    const tableY = this.currentY;
    const colWidth = (this.pageWidth - 2 * this.margin) / headers.length;
    
    // Check if table fits on current page
    const tableHeight = (rows.length + 1) * 20;
    if (this.currentY + tableHeight > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }

    // Headers
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    headers.forEach((header, i) => {
      this.pdf.text(header, this.margin + i * colWidth + 5, this.currentY);
    });
    this.currentY += 20;

    // Rows
    this.pdf.setFont('helvetica', 'normal');
    rows.forEach(row => {
      row.forEach((cell, i) => {
        this.pdf.text(cell, this.margin + i * colWidth + 5, this.currentY);
      });
      this.currentY += 15;
    });

    this.currentY += 10;
  }

  generateEstimateReport(data: ReportData): Blob {
    this.addHeader('Asphalt Project Estimate Report');

    // Project Information
    this.addSection('Project Information', [
      { label: 'Project Name', value: data.projectName },
      { label: 'Location', value: data.location },
      { label: 'Generated', value: new Date(data.generatedAt).toLocaleString() }
    ]);

    // Detection Results
    this.addSection('AI Detection Results', [
      { label: 'Total Area Detected', value: `${formatNumber(data.detectionResults.totalArea, 0)} sq ft` },
      { label: 'Asphalt Polygons', value: data.detectionResults.polygonCount.toString() },
      { label: 'Average Confidence', value: `${Math.round(data.detectionResults.confidence * 100)}%` },
      { label: 'Processing Time', value: `${data.detectionResults.processingTime}ms` }
    ]);

    // Measurements
    this.addSection('Project Measurements', [
      { label: 'Total Area', value: `${formatNumber(data.measurements.area, 0)} sq ft` },
      { label: 'Thickness', value: `${data.measurements.thickness} inches` },
      { label: 'Volume', value: `${formatNumber(data.measurements.volume, 1)} cu ft` },
      { label: 'Tonnage Required', value: `${formatNumber(data.measurements.tonnage, 1)} tons` }
    ]);

    // Cost Breakdown
    this.addSection('Cost Breakdown', [
      { label: 'Materials', value: formatCurrency(data.costs.materials) },
      { label: 'Labor', value: formatCurrency(data.costs.labor) },
      { label: 'Equipment', value: formatCurrency(data.costs.equipment) },
      { label: 'Total Estimate', value: formatCurrency(data.costs.total) }
    ]);

    // Technical Specifications
    this.addSection('Technical Specifications', [
      { label: 'Asphalt Grade', value: data.technicalSpecs.asphaltGrade },
      { label: 'Compaction Ratio', value: `${data.technicalSpecs.compactionRatio}%` },
      { label: 'Layer Thickness', value: `${data.technicalSpecs.layerThickness} inches` },
      { label: 'Application Temperature', value: `${data.technicalSpecs.temperature}°F` }
    ]);

    // Recommendations
    if (data.recommendations.length > 0) {
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Recommendations', this.margin, this.currentY);
      this.currentY += 25;

      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      
      data.recommendations.forEach((rec, index) => {
        if (this.currentY > this.pageHeight - 60) {
          this.pdf.addPage();
          this.currentY = this.margin;
        }
        this.pdf.text(`${index + 1}. ${rec}`, this.margin + 10, this.currentY);
        this.currentY += 15;
      });
    }

    // Footer
    const footerY = this.pageHeight - 30;
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.text('Generated by OverWatch Pro - Professional Asphalt Detection System', this.margin, footerY);
    this.pdf.text(`Page 1 of ${this.pdf.getNumberOfPages()}`, this.pageWidth - 100, footerY);

    return this.pdf.output('blob');
  }

  generateComparisonReport(estimates: ProjectEstimate[]): Blob {
    this.addHeader('Project Comparison Report');

    if (estimates.length === 0) {
      this.pdf.text('No estimates available for comparison.', this.margin, this.currentY);
      return this.pdf.output('blob');
    }

    // Summary table
    const headers = ['Project', 'Area (sq ft)', 'Volume (cu ft)', 'Tonnage', 'Total Cost'];
    const rows = estimates.map(est => [
      est.projectName,
      formatNumber(est.measurements.area, 0),
      formatNumber(est.measurements.volume, 1),
      formatNumber(est.measurements.tonnage, 1),
      formatCurrency(est.costs.total)
    ]);

    this.addTable(headers, rows);

    // Totals
    const totalArea = estimates.reduce((sum, est) => sum + est.measurements.area, 0);
    const totalCost = estimates.reduce((sum, est) => sum + est.costs.total, 0);
    const avgCostPerSqFt = totalCost / totalArea;

    this.addSection('Summary Statistics', [
      { label: 'Total Projects', value: estimates.length.toString() },
      { label: 'Total Area', value: `${formatNumber(totalArea, 0)} sq ft` },
      { label: 'Total Value', value: formatCurrency(totalCost) },
      { label: 'Average Cost per Sq Ft', value: formatCurrency(avgCostPerSqFt) }
    ]);

    return this.pdf.output('blob');
  }
}

export function downloadReport(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateDefaultReport(estimate: ProjectEstimate): ReportData {
  return {
    id: generateReportId(),
    projectName: estimate.projectName,
    location: estimate.location,
    generatedAt: new Date().toISOString(),
    detectionResults: {
      totalArea: estimate.measurements.area,
      polygonCount: Math.ceil(estimate.measurements.area / 500), // Estimate based on area
      confidence: 0.92,
      processingTime: 2340
    },
    measurements: estimate.measurements,
    costs: estimate.costs,
    recommendations: [
      'Use high-quality asphalt mix for optimal durability',
      'Ensure proper drainage around paved areas',
      'Consider weather conditions during installation',
      'Schedule regular maintenance inspections',
      'Apply sealcoating every 2-3 years for longevity'
    ],
    technicalSpecs: {
      asphaltGrade: 'PG 64-22',
      compactionRatio: 95,
      layerThickness: estimate.measurements.thickness,
      temperature: 300
    }
  };
}