// Shivkrupa Appraisal PDF Mapper
// Maps input data to the variables required by the shivkrupa EJS template

import { extractNumericValue, containsMarathiNumbers, convertEnglishToMarathi } from '../marathiNumberUtils.js';

function shivkrupaRenderData({ data = {}, appConfig = {}, bankDetails = {}, jewelleryImagePath = '', selectedTests = [], selectedValuation = [], customerDetails = {}, ornaments = [], bankFields = {} }) {
  const get = (obj, key, fallback = '') => (obj && obj[key] !== undefined ? obj[key] : fallback);

  // Helper to format numbers as Marathi currency
  function formatCurrency(val) {
    const formatted = Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
    return convertEnglishToMarathi(formatted);
  }
  function formatNumber(val) {
    return convertEnglishToMarathi(Number(val).toFixed(2));
  }

  // Prefer explicit params, fallback to data
  const items = (ornaments.length ? ornaments : data.items || []).map(item => {
    // Convert all fields to English numbers for calculation, then to Marathi for display
    const fields = ['units', 'grossWeight', 'netWeight', 'goldRate'];
    let result = {};
    fields.forEach(field => {
      const val = get(item, field);
      const num = extractNumericValue(val);
      result[field] = convertEnglishToMarathi(num.toString());
    });
    // Special formatting for currency fields
    const approxValueNum = extractNumericValue(get(item, 'approxValue'));
    const finalLoanValueNum = extractNumericValue(get(item, 'finalLoanValue'));
    result['approxValue'] = formatCurrency(approxValueNum);
    result['finalLoanValue'] = formatCurrency(finalLoanValueNum);
    return {
      description: get(item, 'description'),
      ...result
    };
  });

  // Calculate totals as numbers
  const totalUnits = items.reduce((sum, item) => sum + extractNumericValue(item.units), 0);
  const totalGrossWeight = items.reduce((sum, item) => sum + extractNumericValue(item.grossWeight), 0);
  const totalNetWeight = items.reduce((sum, item) => sum + extractNumericValue(item.netWeight), 0);
  const totalApproxValue = items.reduce((sum, item) => sum + extractNumericValue(item.approxValue), 0);
  const totalFinalLoanValue = items.reduce((sum, item) => sum + extractNumericValue(item.finalLoanValue), 0);

  // Marathi label for apprenticeType
  const apprenticeTypeMarathi = {
    apprentice: 'मूल्यांकन',
    reapprentice: 'पुनर्मूल्यांकन',
  };

  // S3 base URL for images
  const s3BaseUrl = appConfig?.s3BaseUrl?.replace(/\/$/, '') || '';
  const jewellerLogo = appConfig?.companyLogo ? `${s3BaseUrl}/${appConfig.companyLogo.replace(/^\//, '')}` : get(data, 'jewellerLogo');
  const jewellerPhoto = jewelleryImagePath ? `${s3BaseUrl}/${jewelleryImagePath.replace(/^\//, '')}` : get(data, 'jewellerPhoto');
  const jewellerSignature = appConfig?.signature ? `${s3BaseUrl}/${appConfig.signature.replace(/^\//, '')}` : get(data, 'jewellerSignature');

  return {
    companyName: appConfig?.companyName || get(data, 'companyName'),
    certificateNumber: get(data, 'certificateNumber'),
    appraisalDate: get(data, 'appraisalDate') || new Date().toLocaleDateString('en-IN'),
    managerName: get(data, 'managerName'),
    branchName: get(data, 'selectedBranch') || get(bankDetails, 'selectedBranch'),
    evaluationDate: get(data, 'evaluationDate') || new Date().toLocaleDateString('en-IN'),
    evaluatorDate: get(data, 'evaluatorDate') || new Date().toLocaleDateString('en-IN'),
    customerName: customerDetails?.customerName || get(data, 'customerName'),
    customerAddress: customerDetails?.address || get(data, 'customerAddress'),
    accountNumber: customerDetails?.accountNumber || get(data, 'accountNumber'),
    pouchNumber: customerDetails?.pouchNumber || get(data, 'pouchNumber'),
    phone: customerDetails?.phone || get(data, 'phone'),
    additionalInfo: get(data, 'additionalInfo'),
    finalDate: get(data, 'finalDate') || new Date().toLocaleDateString('en-IN'),
    place: get(data, 'place'),
    jewellerLogo,
    jewellerName: appConfig?.companyName || get(data, 'jewellerName'),
    jewellerAddress: appConfig?.companyAddress || get(data, 'jewellerAddress'),
    jewellerPhone: appConfig?.companyPhone || get(data, 'jewellerPhone'),
    jewellerEmail: appConfig?.companyEmail || get(data, 'jewellerEmail'),
    jewellerMembershipNo: appConfig?.membershipNo || get(data, 'jewellerMembershipNo'),
    jewellerAccountNo: bankDetails?.accountNo || get(data, 'jewellerAccountNo'),
    apprenticeType: apprenticeTypeMarathi[get(data, 'apprenticeType')] || get(data, 'apprenticeType'),
    jewellerPhoto,
    jewellerSignature,
    items,
    totalUnits: formatNumber(totalUnits),
    totalGrossWeight: formatNumber(totalGrossWeight),
    totalNetWeight: formatNumber(totalNetWeight),
    totalApproxValue: formatCurrency(totalApproxValue),
    totalFinalLoanValue: formatCurrency(totalFinalLoanValue),
  };
}

export { shivkrupaRenderData }; 