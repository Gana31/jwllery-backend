// Helper function to conditionally format phone numbers
const formatPhoneNumbers = (phone, mobile) => {
  const hasPhone = phone && phone.trim() !== '' && phone !== 'null' && phone !== 'undefined';
  const hasMobile = mobile && mobile.trim() !== '' && mobile !== 'null' && mobile !== 'undefined';
  if (hasPhone && hasMobile) {
    return `Phone: ${phone}, Mobile: ${mobile}`;
  } else if (hasPhone) {
    return `Phone: ${phone}`;
  } else if (hasMobile) {
    return `Mobile: ${mobile}`;
  } else {
    return '';
  }
};

export function maharashtraRenderData({ data, appConfig, bankDetails, jewelleryImagePath, selectedTests, selectedValuation, customerDetails, ornaments, bankFields }) {

 
    const formatToTwoDecimals = value => (parseFloat(value) || 0).toFixed(2);
  const formatToThreeDecimals = value => (parseFloat(value) || 0).toFixed(3);
  const formatIndianCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    });
  }
  const s3BaseUrl = appConfig?.s3BaseUrl?.replace(/\/$/, '') || '';
  const bankLogoUrl = bankDetails?.logoPath ? `${s3BaseUrl}/${bankDetails.logoPath.replace(/^\//, '')}` : '';
  const jewellerSignatureUrl = appConfig?.signature ? `${s3BaseUrl}/${appConfig.signature.replace(/^\//, '')}` : '';
  const jewellerName = appConfig?.companyName || '';
  const jewellerPhone = formatPhoneNumbers(appConfig?.companyPhone, appConfig?.companyMobile);
  const jewellerAddress = appConfig?.companyAddress || '';
  const jewellerEmail = appConfig?.companyEmail || '';
  const jewellerAccountNumber = bankDetails?.accountNo || '';
  const iovMembershipNo = appConfig?.membershipNo || '';
  const branchName = data.selectedBranch || '';
  const borrowerName = customerDetails?.customerName || '';
  const cifNumber = customerDetails?.cifNumber || '';
  const phone = customerDetails?.phone || '';
  const pouchNo = customerDetails?.pouchNo || '';
  const loanAmount = data.loanAmount || '';
  const requestedBy = customerDetails?.customerName || '';
  let appraisalType = 'Appraised';
  let disclaimerAppraisalType = 'assessed/appraised';
  if (data.apprenticeType === 'reapprentice') {
    appraisalType = 'Reappraised';
    disclaimerAppraisalType = 'reassessed/reappraised';
  }
  const partyDetails = data.partyDetails || '';
  const appraiserSignature = appConfig?.companyName || '';
  const officeCifNo = customerDetails?.officeCifNo || '';
  // Status mapping: ensure boolean
  const status = typeof bankFields.status === 'boolean' ? bankFields.status : false;
  // User address mapping
  const userAddress = customerDetails?.address || '';

  // Table mapping with correct frontend fields and calculated market values
  const jewelryItems = (ornaments || []).map(item => {
    const netWeight = parseFloat(item.netWeight || 0);
    const caratRate = parseFloat(item.caratRate || 0);
    const caratRatePerGm = parseFloat(item.caratRatePerGm || 0);
    return {
      description: item.description,
      grossWeight: item.grossWeight,
      netWeightExcludingStones: item.netWeight || '', // netWeight from frontend
      purity: item.carat || '', // carat from frontend
      marketValue1: (netWeight * caratRate).toFixed(2), // calculated value
      marketValue2: (netWeight * caratRatePerGm).toFixed(2), // calculated value
    };
  });

  // Totals for table
  const totalGrossWeight = jewelryItems.reduce((sum, item) => sum + parseFloat(item.grossWeight || 0), 0).toFixed(2);
  const totalNetWeightExcludingStones = jewelryItems.reduce((sum, item) => sum + parseFloat(item.netWeightExcludingStones || 0), 0).toFixed(2);
  const totalMarketValue1 = jewelryItems.reduce((sum, item) => sum + parseFloat(item.marketValue1 || 0), 0).toFixed(2);
  const totalMarketValue2 = jewelryItems.reduce((sum, item) => sum + parseFloat(item.marketValue2 || 0), 0).toFixed(2);

  // Jewellery photo from uploaded file
  const jewelleryPhotoUrl = jewelleryImagePath ? `${s3BaseUrl}/${jewelleryImagePath.replace(/^\//, '')}` : '';

  // Gold loan account no
  const goldLoanAccountNo = bankDetails?.goldLoanAccountNo || bankFields?.goldLoanAccountNo || '';

  // Amount (bottom) and loan/cash credit limit sanctioned
  const sanctionedAmount = bankDetails?.sanctionedAmount || bankFields?.sanctionedAmount || '';

  // Tenure of loan
  const loanTenure = bankDetails?.tenure || bankFields?.tenure || '';

  // Map apprenticeType to appraisalType and disclaimerAppraisalType
  // Map all to EJS
  // Format date fields to DD/MM/YYYY
  function formatDateOnly(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-GB');
  }

  // Use formatted dates
  const officeDate = formatDateOnly(bankFields.dateOfSanction);
  const appraisalDate = formatDateOnly(bankFields.dateOfSanction);
  const sanctionDate = formatDateOnly(bankFields.dateOfSanction);

  // Format totals and amounts as Indian currency
  const formattedTotalMarketValue1 = formatIndianCurrency(totalMarketValue1);
  const formattedTotalMarketValue2 = formatIndianCurrency(totalMarketValue2);
  const formattedSanctionedAmount = formatIndianCurrency(sanctionedAmount);
  const formattedRequestedAmount = formatIndianCurrency(customerDetails.requestedAmount || '');

  return {
    bankLogoUrl,
    jewellerSignatureUrl,
    jewellerName,
    jewellerPhone,
    jewellerAddress,
    jewellerEmail,
    jewellerAccountNumber,
    iovMembershipNo,
    branchName,
    borrowerName,
    cifNumber,
    loanAmount,
    requestedBy,
    appraisalType,
    partyDetails : customerDetails.address || '',
    phone,
    pouchNo,
    appraiserSignature,
    goldLoanAccountNo,
    officeCifNo,
    status,
    date:new Date().toLocaleDateString('en-GB'),
    totalGrossWeight,
    eligibleNetWeight: totalNetWeightExcludingStones,
    sanctionedAmount: formattedSanctionedAmount,
    sanctionDate,
    loanTenure,
    disclaimerAppraisalType,
    appraisalCharges: customerDetails.appraisalCharges || '',
    officeDate,
    appraisalDate,
    jewelryItems,
    totalNetWeightExcludingStones,
    totalMarketValue1: formattedTotalMarketValue1,
    totalMarketValue2: formattedTotalMarketValue2,
    requestedAmount: formattedRequestedAmount,
    jewellerPhotoUrl : jewelleryPhotoUrl || '',
    appraisalDate : bankFields.dateOfSanction || '',
    userAddress,
    analytics: {
      bankName: bankDetails?.bankName || 'Maharashtra',
      branchName: branchName,
      bankLogo: bankDetails?.logoPath ? `${s3BaseUrl}/${bankDetails.logoPath.replace(/^\//, '')}` : '',
      customerName: customerDetails?.customerName || '',
      phone: customerDetails?.phone || '',
      accountNumber: customerDetails?.accountNumber || '',
      punchNo: customerDetails?.pouchNo || '',
      items: (ornaments || []).map(item => ({
        description: item.description,
        units: item.units || '',
        grossWeight: item.grossWeight || '',
        netWeight: item.netWeight || '',
        approxValue: item.approxValue || ''
      })),
      totalUnits: (ornaments || []).reduce((sum, item) => sum + (parseFloat(item.units || 0) || 0), 0).toFixed(2),
      totalGrossWeight: totalGrossWeight,
      totalNetWeight: totalNetWeightExcludingStones,
      totalValue: formattedTotalMarketValue1,
      jewelleryImage: jewelleryPhotoUrl,
      date: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  };
} 