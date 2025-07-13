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

export function sbiRenderData({ data, appConfig, bankDetails, jewelleryImagePath, selectedTests, selectedValuation, customerDetails, ornaments ,bankFields}) {
  const formatToTwoDecimals = value => (parseFloat(value) || 0).toFixed(2);
  const formatToThreeDecimals = value => (parseFloat(value) || 0).toFixed(3);
  
  // Indian currency formatter
  const formatIndianCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    });
  };
  const goldItems = ornaments.map(item => {
    const netWeight = parseFloat(item['Net Weight (Gross Weight less Vaux, Stones, dust etc) Grams'] || item['netWeight'] || '0') || 0;
    const goldRate = parseFloat(item['Gold Rate Per Carat 22/20/18'] || item['goldRate'] || '0') || 0;
    const frontendApprox = parseFloat(item['Approx Value In Rupees'] || item['approxValue'] || '0');
    return {
      description: item['Description of Gold Ornaments'] || item['description'],
      units: formatToTwoDecimals(item['No Of Units'] || item['units'] || '0'),
      purity: formatToTwoDecimals(item['Purity in Carat'] || item['purity'] || '0'),
      grossWeight: formatToThreeDecimals(item['Gross Weight in Grams'] || item['grossWeight'] || '0'),
      netWeight: formatToThreeDecimals(netWeight),
      goldRate: formatToTwoDecimals(goldRate),
      approxValue: formatToTwoDecimals(frontendApprox),
    };
  });
  let totalUnits = 0, totalGrossWeight = 0, totalNetWeight = 0, totalApproxValue = 0;
  goldItems.forEach(item => {
    totalUnits += parseFloat(item.units || '0') || 0;
    totalGrossWeight += parseFloat(item.grossWeight || '0') || 0;
    totalNetWeight += parseFloat(item.netWeight || '0') || 0;
    totalApproxValue += parseFloat(item.approxValue || '0') || 0;
  });
  const valuations = (selectedValuation || []).map(percentage => ({
    percentage: formatToTwoDecimals(percentage),
    amount: formatIndianCurrency((totalApproxValue * (percentage / 100)))
  }));
  const now = new Date();
  let jewelryImage = '';
  if (
    jewelleryImagePath &&
    typeof jewelleryImagePath === 'string' &&
    jewelleryImagePath.trim() !== '' &&
    jewelleryImagePath !== 'null' &&
    jewelleryImagePath !== 'undefined' &&
    !jewelleryImagePath.includes('placeholder') &&
    !jewelleryImagePath.includes('default')
  ) {
    jewelryImage = `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${jewelleryImagePath.replace(/^\//, '')}`;
  }
  let bankManagerName = '';
  if (bankFields && typeof bankFields === 'object') {
    bankManagerName = bankFields.bankManagerName || '';
  }
  // Signature URL
  const signatureUrl = appConfig?.signature ? `${appConfig.s3BaseUrl?.replace(/\/$/, '')}/${appConfig.signature.replace(/^\//, '')}` : '';
  
  // Format phone numbers conditionally
  const formattedPhoneNumbers = formatPhoneNumbers(appConfig?.companyPhone, appConfig?.companyMobile);
  
  return {
    branchCode: data.selectedBranch,
    customerName: customerDetails?.customerName || '',
    address: customerDetails?.address || '',
    mobile: customerDetails?.phone || '',
    accountNumber: customerDetails?.accountNumber || '',
    pouchNumber: customerDetails?.pouchNo || '',
    appraisalDate: now.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, day: '2-digit', month: '2-digit', year: 'numeric' }),
    apprenticeType: data.apprenticeType,
    reApprenticeName: data.reApprenticeName || '',
    purityTestMethod: (selectedTests || []).join(', '),
    place: data.selectedBranch,
    date: now.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, day: '2-digit', month: '2-digit', year: 'numeric' }),
    jewelryImage,
    jewellerPhoto: (`${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${appConfig?.companyLogo?.replace(/^\//, '')}`) || '',
    jewellerName: appConfig?.companyName || '',
    jewellerSubtitle: 'Goldsmith and Valuer',
    jewellerPhone: formattedPhoneNumbers,
    jewellerMobile: '', // This field is now handled by jewellerPhone
    jewellerAddress: appConfig?.companyAddress || '',
    jewellerEmail: `Email: ${appConfig?.companyEmail || ''}`,
    jewellerAccount: `A/c no: ${bankDetails?.accountNo || '123123123'}`,
    jewellerMembership: `IOV membership No. : ${appConfig?.membershipNo || "V123-42-313000"}`,
    goldRateDate: now.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, day: '2-digit', month: '2-digit', year: 'numeric' }),
    goldItems,
    totalUnits: formatToTwoDecimals(totalUnits),
    totalGrossWeight: formatToThreeDecimals(totalGrossWeight),
    totalNetWeight: formatToThreeDecimals(totalNetWeight),
    totalValue: formatIndianCurrency(totalApproxValue),
    valuations,
    bankManagerName,
    signatureUrl,
  };
} 