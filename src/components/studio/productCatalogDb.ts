export interface ProductItem {
  id: string;
  name: string;
  category: 'printing' | 'factory' | 'designer';
  hsnCode: string;
  unit: string; // 'pcs', 'sq ft', 'meters', 'hrs', 'job'
  defaultRate: number;
  taxPercent: number; // 0, 5, 12, 18
  description?: string;
}

export const defaultProducts: ProductItem[] = [
  // Printing Owner Panel Products
  { id: 'p1', name: 'Sublimation Full Jersey Printing', category: 'printing', hsnCode: '998898', unit: 'pcs', defaultRate: 15, taxPercent: 12, description: 'High resolution 300 DPI sublimation paper print roll' },
  { id: 'p2', name: 'Sublimation Front Panel Printing', category: 'printing', hsnCode: '998898', unit: 'pcs', defaultRate: 8, taxPercent: 12, description: 'Single panel sublimation paper plot' },
  { id: 'p3', name: 'DTF Printing (Sq Ft)', category: 'printing', hsnCode: '998898', unit: 'sq ft', defaultRate: 35, taxPercent: 18, description: 'Direct-to-Film vibrant transfer film print' },
  { id: 'p4', name: 'Plotter Sublimation Paper Roll (Meters)', category: 'printing', hsnCode: '4811', unit: 'meters', defaultRate: 45, taxPercent: 18, description: 'Continuous sublimation transfer paper roll' },
  { id: 'p5', name: 'Size Grading & File RIP Setup', category: 'printing', hsnCode: '998314', unit: 'job', defaultRate: 350, taxPercent: 18, description: 'Automatic XS-7XL size grading & nested plot file export' },

  // Factory Owner Panel Products
  { id: 'f1', name: 'Custom Sublimation Jersey (Full Kit)', category: 'factory', hsnCode: '6109', unit: 'pcs', defaultRate: 280, taxPercent: 5, description: 'Jersey + Shorts full sublimation set with custom names & numbers' },
  { id: 'f2', name: 'Sublimation Polo T-Shirt (Half Sleeve)', category: 'factory', hsnCode: '6105', unit: 'pcs', defaultRate: 320, taxPercent: 5, description: 'Custom collar polo t-shirt cut & stitched' },
  { id: 'f3', name: 'Cricket Roster Manufacturing (Cut-to-Pack)', category: 'factory', hsnCode: '6109', unit: 'pcs', defaultRate: 240, taxPercent: 5, description: 'Complete fabric, sublimation printing, cutting & stitching' },
  { id: 'f4', name: 'Stitching & Assembly Fee (Per Piece)', category: 'factory', hsnCode: '998898', unit: 'pcs', defaultRate: 45, taxPercent: 5, description: 'Overlock stitching, collar attachment & hem finishing' },
  { id: 'f5', name: 'Collar & Cuff Ribbing Set', category: 'factory', hsnCode: '6006', unit: 'pcs', defaultRate: 25, taxPercent: 5, description: 'Custom knitted jacquard collar & cuff rib set' },

  // Designer Panel Products
  { id: 'd1', name: 'Custom 3D Sportswear Design Creation', category: 'designer', hsnCode: '998391', unit: 'job', defaultRate: 750, taxPercent: 18, description: 'Original 3D jersey design, pattern vectorization & colorways' },
  { id: 'd2', name: 'Vector Logo Tracing & HD Cleanup', category: 'designer', hsnCode: '998391', unit: 'pcs', defaultRate: 250, taxPercent: 18, description: 'Convert low-res WhatsApp logo image to vector AI/CDR/PSD format' },
  { id: 'd3', name: '3D Jersey Mockup Render Pack', category: 'designer', hsnCode: '998391', unit: 'job', defaultRate: 500, taxPercent: 18, description: 'High-res 3D video & photo realistic mockup renders for social media' },
  { id: 'd4', name: 'Custom Size Grading Pattern File', category: 'designer', hsnCode: '998391', unit: 'job', defaultRate: 400, taxPercent: 18, description: 'Graded vector pattern DXF/PSD file from XS to 7XL' },
];

export function getStoredProducts(): ProductItem[] {
  const saved = localStorage.getItem('fivenest_products_db');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return defaultProducts;
}

export function saveStoredProducts(products: ProductItem[]) {
  localStorage.setItem('fivenest_products_db', JSON.stringify(products));
}
