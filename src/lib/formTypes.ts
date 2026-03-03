export interface FormData {
  // Section 1
  businessName: string;
  industry: string;
  numberOfStaff: string;
  monthlyRevenue: string;
  avgTransactionValue: string;

  // Section 2
  monthlyVisitors: string;
  monthlyLeads: string;
  conversionRate: string;
  monthlyNewCustomers: string;
  avgPurchaseValue: string;
  avgPurchasesPerYear: string;
  avgRetentionYears: string;

  // Section 3
  hoursAdmin: string;
  hoursBooking: string;
  hoursFollowUps: string;
  hoursInvoicing: string;
  hourlyStaffCost: string;
  lostSalesReasons: string[];

  // Section 4
  currentFeatures: string[];
  conversionImpactAnswer: string;
}

export interface ROIResults {
  revenueLift: number;
  operationalSavings: number;
  retentionImprovement: number;
  totalAnnualImpact: number;
  roiPercentage: number;
  breakEvenMonths: number;
  currentMonthlyRevenue: number;
  newMonthlyRevenue: number;
  currentConversion: number;
  newConversion: number;
  weeklyAdminHours: number;
  weeklySavingsHours: number;
  activeCustomers: number;
  clv: number;
}

export const initialFormData: FormData = {
  businessName: '',
  industry: '',
  numberOfStaff: '',
  monthlyRevenue: '',
  avgTransactionValue: '',
  monthlyVisitors: '',
  monthlyLeads: '',
  conversionRate: '',
  monthlyNewCustomers: '',
  avgPurchaseValue: '',
  avgPurchasesPerYear: '',
  avgRetentionYears: '',
  hoursAdmin: '',
  hoursBooking: '',
  hoursFollowUps: '',
  hoursInvoicing: '',
  hourlyStaffCost: '',
  lostSalesReasons: [],
  currentFeatures: [],
  conversionImpactAnswer: '',
};

export const REVENUE_OPTIONS = [
  'Under $20k',
  '$20k–$50k',
  '$50k–$100k',
  '$100k+',
];

export const LOST_SALES_REASONS = [
  'Slow response time',
  'No online booking',
  'No automated follow-up',
  'Poor mobile experience',
  'Manual quoting delays',
];

export const CURRENT_FEATURES = [
  'Online booking',
  'Customer portal',
  'Push notifications',
  'Loyalty system',
  'Automated upsell flows',
  'CRM automation',
];

export const APP_BUILD_COST = 18000;

export function calculateROI(data: FormData): ROIResults {
  const visitors = parseFloat(data.monthlyVisitors) || 0;
  const conversionRate = parseFloat(data.conversionRate) || 0;
  const avgSaleValue = parseFloat(data.avgTransactionValue) || parseFloat(data.avgPurchaseValue) || 0;

  // Revenue Lift
  const currentConversion = conversionRate / 100;
  const currentMonthlySales = visitors * currentConversion * avgSaleValue;
  const improvedConversion = currentConversion * 1.15; // 15% improvement
  const newMonthlySales = visitors * improvedConversion * avgSaleValue;
  const monthlyRevenueLift = newMonthlySales - currentMonthlySales;
  const annualRevenueLift = monthlyRevenueLift * 12;

  // Operational Savings
  const totalWeeklyHours =
    (parseFloat(data.hoursAdmin) || 0) +
    (parseFloat(data.hoursBooking) || 0) +
    (parseFloat(data.hoursFollowUps) || 0) +
    (parseFloat(data.hoursInvoicing) || 0);
  const hourlyRate = parseFloat(data.hourlyStaffCost) || 0;
  const annualAdminCost = totalWeeklyHours * hourlyRate * 52;
  const annualSavings = annualAdminCost * 0.4; // 40% automation

  // Retention & Upsell
  const monthlyCustomers = parseFloat(data.monthlyNewCustomers) || 0;
  const avgPurchaseValue = parseFloat(data.avgPurchaseValue) || avgSaleValue;
  const purchasesPerYear = parseFloat(data.avgPurchasesPerYear) || 1;
  const retentionYears = parseFloat(data.avgRetentionYears) || 1;
  const clv = avgPurchaseValue * purchasesPerYear * retentionYears;
  const activeCustomers = monthlyCustomers * 12;
  const retainedCustomers = activeCustomers * 0.1; // 10% retention improvement
  const retentionValue = retainedCustomers * clv;

  const totalAnnualImpact = annualRevenueLift + annualSavings + retentionValue;
  const roiPercentage = APP_BUILD_COST > 0 ? ((totalAnnualImpact - APP_BUILD_COST) / APP_BUILD_COST) * 100 : 0;
  const breakEvenMonths = totalAnnualImpact > 0 ? (APP_BUILD_COST / (totalAnnualImpact / 12)) : 0;

  return {
    revenueLift: annualRevenueLift,
    operationalSavings: annualSavings,
    retentionImprovement: retentionValue,
    totalAnnualImpact,
    roiPercentage,
    breakEvenMonths,
    currentMonthlyRevenue: currentMonthlySales,
    newMonthlyRevenue: newMonthlySales,
    currentConversion: conversionRate,
    newConversion: conversionRate * 1.15,
    weeklyAdminHours: totalWeeklyHours,
    weeklySavingsHours: totalWeeklyHours * 0.4,
    activeCustomers,
    clv,
  };
}
