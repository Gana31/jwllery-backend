export function unionRenderData({ data, appConfig, bankDetails, jewelleryImagePath, selectedTests, selectedValuation, customerDetails, bankFields, ornaments, reqUser }) {
  const formatToTwoDecimals = value => (parseFloat(value) || 0).toFixed(2);
  const formatToThreeDecimals = value => (parseFloat(value) || 0).toFixed(3);

  function getBankFieldValue(bankFields, fieldName) {
    const field = Array.isArray(bankFields) ? bankFields.find(f => f.name === fieldName) : undefined;
    return field && field.value !== undefined ? field.value : '';
  }
  const goldItems = ornaments.map(item => ({
    description: item.description,
    units: formatToTwoDecimals(item.units || 0),
    grossWeight: formatToThreeDecimals(item.grossWeight || 0),
    netWeight: formatToThreeDecimals(item.netWeight || 0),
    netWeightGrams: formatToTwoDecimals(item.purity || 0),
    purity: formatToTwoDecimals(item.purity || 0),
    equivalentWeight: formatToThreeDecimals(item.equivalentWeight || 0),
    ratePerGram: formatToTwoDecimals(item.ratePerGram || 0),
    value: formatToTwoDecimals(parseFloat(item['Value Of the Gold Ornaments']?.replace(/,/g, '') || 0))
  }));
  let totalUnits = 0, totalGrossWeight = 0, totalNetWeight = 0, totalEquivalentWeight = 0, totalValue = 0 , totalGoldPerGram = 0;
  for (const item of goldItems) {
    totalUnits += parseFloat(item.units || 0);
    totalGrossWeight += parseFloat(item.grossWeight || 0);
    totalNetWeight += parseFloat(item.netWeight || 0);
    totalEquivalentWeight += parseFloat(item.equivalentWeight || 0);
    totalValue += parseFloat(item.value || 0);
    totalGoldPerGram += parseFloat(item.ratePerGram || 0);
  }
  const now = new Date();
  // Signature URL
  const signatureUrl = appConfig?.signature ? `${appConfig.s3BaseUrl?.replace(/\/$/, '')}/${appConfig.signature.replace(/^\//, '')}` : '';
  return {
    bankName: data.selectedBank,
    branchName: data.selectedBranch,
    bankLogoUrl: `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${bankDetails?.logoPath?.replace(/^\//, '')}`|| "",
    betiBachaoLogoUrl: `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${ bankDetails?.extralogoPath?.replace(/^\//, '')}` || "",
    jewellerLogoUrl: `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${appConfig?.companyLogo?.replace(/^\//, '')}`,
    jwellerDetails: {
      jewellerName: appConfig?.companyName || '',
      jewellerSubtitle: appConfig?.typeOfBusiness || '',
      jewellerAddress: appConfig?.companyAddress || '',
      jewellerPhone: appConfig?.companyPhone || '',
      jewellerMobile: appConfig?.companyMobile || '',
      jewellerEmail: appConfig?.companyEmail || '',
      jewellerUbiAc: bankDetails?.accountNo || '000000000',
      membershipNo: appConfig?.membershipNo || '',
    },
    customerDetails: {
      customerName: customerDetails.customerName,
      customerAddress: customerDetails.address,
      mobileNo: customerDetails.phone,
      accountNo: customerDetails.accountNumber,
      custId: customerDetails.customerId,
      bagNo: customerDetails.begNo,
      fatherName: customerDetails.fatherName,
      age: customerDetails.age,
      address: customerDetails.address
    },
    ornaments: goldItems,
    ornamentImage:  jewelleryImagePath && jewelleryImagePath.trim() !== '' && jewelleryImagePath.trim() !== 'null' && jewelleryImagePath.trim() !== 'undefined' && jewelleryImagePath.trim() !== '' && !jewelleryImagePath.includes('placeholder') && !jewelleryImagePath.includes('default') ? `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${jewelleryImagePath?.replace(/^\//, '')}` : undefined ,
    totalUnits: formatToTwoDecimals(totalUnits),
    totalGrossWeight: formatToThreeDecimals(totalGrossWeight),
    totalNetWeight: formatToThreeDecimals(totalNetWeight),
    totalEquivalentWeight: formatToThreeDecimals(totalEquivalentWeight),
    totalValue: formatToTwoDecimals(totalValue),
    bankCardRateWeight: formatToThreeDecimals(totalEquivalentWeight),
    totalGoldPerGram: formatToTwoDecimals(totalGoldPerGram),
    bankCardRate: formatToTwoDecimals(totalGoldPerGram),
    bankCardValue: formatToTwoDecimals(totalValue),
    eligibleAmount: formatToTwoDecimals(totalValue),
    loanRequested: formatToTwoDecimals(getBankFieldValue(bankFields, 'loanRequestedByBorrower')),
    lessMargin: formatToTwoDecimals(getBankFieldValue(bankFields, 'lessMargin35')),
    minimumOfAboveTwo: formatToTwoDecimals(getBankFieldValue(bankFields, 'minimumOfAboveTwo')),
    loanAmount: formatToTwoDecimals(getBankFieldValue(bankFields, 'loanToBeSanctioned')),
    safetyGrant: formatToTwoDecimals(getBankFieldValue(bankFields, 'safetyGrant')),
    marketRateValue: formatToTwoDecimals(getBankFieldValue(bankFields, 'goldAsPerMarketRate')),
    verifierName: reqUser?.username || '',
    verifierFatherName: customerDetails.fatherName || '',
    verifierAge: customerDetails.age || '',
    verifierAddress: customerDetails.address || '',
    certifiedWeight: formatToThreeDecimals(totalEquivalentWeight),
    certifiedPurity: '22.00',
    certifiedLoanAmount: formatToTwoDecimals(getBankFieldValue(bankFields, 'loanToBeSanctioned')),
    selectedTests: selectedTests,
    testDate: now.toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    }),
    signatureUrl,
  };
} 