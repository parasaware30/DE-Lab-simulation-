export interface ConversionStep {
  title: string;
  explanation: string;
  math: string;
}

export interface RadixConversionResult {
  binary: string;
  octal: string;
  decimal: string;
  hex: string;
  steps: ConversionStep[];
  isValid: boolean;
  errorMessage?: string;
  isFractional?: boolean;
}

/**
 * Parses integer or fractional string in any base to decimal number
 */
export function parseNumberToDecimal(input: string, base: 2 | 8 | 10 | 16): number {
  const clean = input.trim().replace(/^[-+]/, '');
  const isNegative = input.trim().startsWith('-');
  if (!clean) throw new Error('Input is empty.');

  const parts = clean.split('.');
  if (parts.length > 2) {
    throw new Error('Number cannot have more than one radix point (.).');
  }

  const intPart = parts[0] || '0';
  const fracPart = parts[1] || '';

  const regexMap: Record<number, RegExp> = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^[0-9]+$/,
    16: /^[0-9a-fA-F]+$/,
  };

  if (intPart !== '0' && !regexMap[base].test(intPart)) {
    throw new Error(`Invalid characters for Base-${base} integer part.`);
  }
  if (fracPart && !regexMap[base].test(fracPart)) {
    throw new Error(`Invalid characters for Base-${base} fractional part.`);
  }

  const intVal = parseInt(intPart, base);
  if (isNaN(intVal)) throw new Error('Integer part parse error.');

  let fracVal = 0;
  for (let i = 0; i < fracPart.length; i++) {
    const digit = parseInt(fracPart[i], base);
    fracVal += digit / Math.pow(base, i + 1);
  }

  const total = intVal + fracVal;
  return isNegative ? -total : total;
}

/**
 * Converts decimal float to target base with up to 6 fractional digits
 */
function decimalToBase(decVal: number, targetBase: 2 | 8 | 16, precision: number = 6): string {
  const isNegative = decVal < 0;
  let absVal = Math.abs(decVal);
  let intPart = Math.floor(absVal);
  let fracPart = absVal - intPart;

  let intStr = intPart.toString(targetBase).toUpperCase();
  if (fracPart === 0) {
    return (isNegative ? '-' : '') + intStr;
  }

  let fracStr = '';
  for (let i = 0; i < precision && fracPart > 0; i++) {
    fracPart *= targetBase;
    const digit = Math.floor(fracPart);
    fracStr += digit.toString(targetBase).toUpperCase();
    fracPart -= digit;
  }

  return (isNegative ? '-' : '') + `${intStr}.${fracStr}`;
}

export function convertRadix(input: string, fromBase: 2 | 8 | 10 | 16): RadixConversionResult {
  try {
    const dec = parseNumberToDecimal(input, fromBase);
    const steps: ConversionStep[] = [];
    const isFractional = input.includes('.');

    // Step 1: Base to Decimal expansion
    if (fromBase !== 10) {
      const clean = input.trim().toUpperCase().replace(/^[-+]/, '');
      const isNeg = input.trim().startsWith('-');
      const [intP = '', fracP = ''] = clean.split('.');

      const terms: string[] = [];
      for (let i = 0; i < intP.length; i++) {
        const digit = parseInt(intP[intP.length - 1 - i], fromBase);
        terms.push(`(${digit} × ${fromBase}^${i})`);
      }
      for (let i = 0; i < fracP.length; i++) {
        const digit = parseInt(fracP[i], fromBase);
        terms.push(`(${digit} × ${fromBase}^-${i + 1})`);
      }

      steps.push({
        title: `Convert Base-${fromBase} to Decimal (Base-10)`,
        explanation: `Sum products of each digit multiplied by weight of positional power (${fromBase}^k):`,
        math: `${isNeg ? '-' : ''}${clean}₍${fromBase}₎ = ${terms.reverse().join(' + ')} = ${dec}₍₁₀₎`,
      });
    }

    const binStr = isFractional ? decimalToBase(dec, 2) : (dec >= 0 ? dec.toString(2) : (dec >>> 0).toString(2));
    const octStr = isFractional ? decimalToBase(dec, 8) : (dec >= 0 ? dec.toString(8) : (dec >>> 0).toString(8));
    const decStr = dec.toString(10);
    const hexStr = isFractional ? decimalToBase(dec, 16) : (dec >= 0 ? dec.toString(16).toUpperCase() : (dec >>> 0).toString(16).toUpperCase());

    if (fromBase !== 2) {
      steps.push({
        title: 'Decimal to Binary (Base-2)',
        explanation: 'Repeated division by 2 for integer part and multiplication by 2 for fractional part:',
        math: `${dec}₍₁₀₎ = ${binStr}₍₂₎`,
      });
    }

    if (fromBase !== 8) {
      steps.push({
        title: 'Decimal to Octal (Base-8)',
        explanation: 'Grouping binary into 3-bit clusters or repeated base-8 operations:',
        math: `${dec}₍₁₀₎ = ${octStr}₍₈₎`,
      });
    }

    if (fromBase !== 16) {
      steps.push({
        title: 'Decimal to Hexadecimal (Base-16)',
        explanation: 'Grouping binary into 4-bit nibbles (0-9, A=10, B=11, C=12, D=13, E=14, F=15):',
        math: `${dec}₍₁₀₎ = ${hexStr}₍₁₆₎`,
      });
    }

    return {
      binary: binStr,
      octal: octStr,
      decimal: decStr,
      hex: hexStr,
      steps,
      isValid: true,
      isFractional,
    };
  } catch (err: unknown) {
    return {
      binary: '',
      octal: '',
      decimal: '',
      hex: '',
      steps: [],
      isValid: false,
      errorMessage: err instanceof Error ? err.message : 'Conversion error',
    };
  }
}

export interface ComplementResult {
  originalDecimal: number;
  bitWidth: number;
  magnitudeBinary: string;
  onesComplement: string;
  twosComplement: string;
  bitwiseInversion: string;
  bitwiseTwos: string;
  signBit: 0 | 1;
  hasOverflow: boolean;
  explanation: string;
}

export function computeComplements(decimalValue: number, bitWidth: 4 | 8 | 16 = 8): ComplementResult {
  const minVal = -(1 << (bitWidth - 1));
  const maxVal = (1 << (bitWidth - 1)) - 1;

  const hasOverflow = decimalValue < minVal || decimalValue > maxVal;
  const absVal = Math.abs(decimalValue);
  const posBin = (absVal & ((1 << bitWidth) - 1)).toString(2).padStart(bitWidth, '0');

  // True bitwise inversion of positive binary magnitude (~X)
  const bitwiseInv = posBin.split('').map(b => (b === '0' ? '1' : '0')).join('');
  const bitwiseTwosInt = (parseInt(bitwiseInv, 2) + 1) & ((1 << bitWidth) - 1);
  const bitwiseTwosStr = bitwiseTwosInt.toString(2).padStart(bitWidth, '0');

  if (decimalValue >= 0) {
    const bin = (decimalValue & ((1 << bitWidth) - 1)).toString(2).padStart(bitWidth, '0');
    return {
      originalDecimal: decimalValue,
      bitWidth,
      magnitudeBinary: bin,
      onesComplement: bin, // standard representation for positive
      twosComplement: bin, // standard representation for positive
      bitwiseInversion: bitwiseInv,
      bitwiseTwos: bitwiseTwosStr,
      signBit: 0,
      hasOverflow,
      explanation: `For positive integer (+${decimalValue}) in ${bitWidth}-bit:\n1. True Binary: ${bin}\n2. Bitwise Inversion (~X): ${bitwiseInv}\n3. Bitwise 2's Complement (~X + 1): ${bitwiseTwosStr}\nIn standard signed binary notation, positive numbers retain sign bit 0 and uncomplemented magnitude: ${bin}.`,
    };
  } else {
    // Negative number
    return {
      originalDecimal: decimalValue,
      bitWidth,
      magnitudeBinary: posBin,
      onesComplement: bitwiseInv,
      twosComplement: bitwiseTwosStr,
      bitwiseInversion: bitwiseInv,
      bitwiseTwos: bitwiseTwosStr,
      signBit: 1,
      hasOverflow,
      explanation: `For negative number (${decimalValue}) in ${bitWidth}-bit:\n1. Positive Magnitude: ${posBin}\n2. 1's Complement (invert all bits): ${bitwiseInv}\n3. 2's Complement (+ 1 to 1's complement): ${bitwiseTwosStr}\nMSB is 1 indicating negative polarity.`,
    };
  }
}

export interface BinaryAdditionResult {
  sumBinary: string;
  sumDecimal: number;
  carries: string;
  hasCarryOut: boolean;
}

export function addBinary(binA: string, binB: string): BinaryAdditionResult {
  const cleanA = binA.replace(/[^01]/g, '') || '0';
  const cleanB = binB.replace(/[^01]/g, '') || '0';
  const maxLen = Math.max(cleanA.length, cleanB.length);
  const a = cleanA.padStart(maxLen, '0');
  const b = cleanB.padStart(maxLen, '0');

  let carry = 0;
  const sumChars: string[] = [];
  const carryChars: string[] = [];

  for (let i = maxLen - 1; i >= 0; i--) {
    const bitA = parseInt(a[i], 10);
    const bitB = parseInt(b[i], 10);
    const total = bitA + bitB + carry;

    sumChars.unshift((total % 2).toString());
    carry = Math.floor(total / 2);
    carryChars.unshift(carry.toString());
  }

  if (carry > 0) {
    sumChars.unshift('1');
  }

  const sumBinary = sumChars.join('');
  return {
    sumBinary,
    sumDecimal: parseInt(sumBinary, 2),
    carries: carryChars.join(''),
    hasCarryOut: carry > 0,
  };
}

export interface BinarySubtractionResult {
  diffBinary: string;
  diffDecimal: number;
  twosCompB: string;
  additionWithTwosComp: string;
  isNegative: boolean;
  steps: string[];
}

export function subtractBinary(binA: string, binB: string, bitWidth: number = 8): BinarySubtractionResult {
  const cleanA = binA.replace(/[^01]/g, '') || '0';
  const cleanB = binB.replace(/[^01]/g, '') || '0';
  const decA = parseInt(cleanA, 2);
  const decB = parseInt(cleanB, 2);
  const diffDec = decA - decB;

  // Ensure bit width can accommodate both operands and signed extension
  const actualBitWidth = Math.max(bitWidth, cleanA.length + 1, cleanB.length + 1);

  // 2's complement of B in given bitWidth
  const bPadded = decB.toString(2).padStart(actualBitWidth, '0');
  const bInv = bPadded.split('').map(b => (b === '0' ? '1' : '0')).join('');
  const bTwos = ((parseInt(bInv, 2) + 1) % Math.pow(2, actualBitWidth)).toString(2).padStart(actualBitWidth, '0');

  // Addition of A and (-B) in 2's complement
  const aPadded = decA.toString(2).padStart(actualBitWidth, '0');
  const sumInt = parseInt(aPadded, 2) + parseInt(bTwos, 2);
  const sumBin = sumInt.toString(2);

  const steps = [
    `1. Represent A (${decA}₁₀) in ${actualBitWidth}-bit: ${aPadded}₂`,
    `2. Represent B (${decB}₁₀) in ${actualBitWidth}-bit: ${bPadded}₂`,
    `3. Compute 2's complement of B: Invert (${bInv}₂) + 1 = ${bTwos}₂`,
    `4. Add A + (2's complement of B): ${aPadded} + ${bTwos} = ${sumBin}₂`,
  ];

  if (diffDec >= 0) {
    steps.push(`5. Carry-out of 1 is discarded in 2's complement subtraction. Result is positive: ${diffDec.toString(2)}₂ (${diffDec}₁₀).`);
  } else {
    steps.push(`5. No carry-out generated, indicating negative result. Result in 2's complement is ${sumBin.slice(-actualBitWidth)}₂ (${diffDec}₁₀).`);
  }

  return {
    diffBinary: diffDec >= 0 ? diffDec.toString(2) : `-${Math.abs(diffDec).toString(2)}`,
    diffDecimal: diffDec,
    twosCompB: bTwos,
    additionWithTwosComp: sumBin,
    isNegative: diffDec < 0,
    steps,
  };
}

export interface BinaryMultiplicationResult {
  productBinary: string;
  productDecimal: number;
  partialProducts: { shift: number; value: string }[];
}

export function multiplyBinary(binA: string, binB: string): BinaryMultiplicationResult {
  const cleanA = binA.replace(/[^01]/g, '') || '0';
  const cleanB = binB.replace(/[^01]/g, '') || '0';
  const decA = parseInt(cleanA, 2);
  const decB = parseInt(cleanB, 2);
  const prodDec = decA * decB;

  const partialProducts: { shift: number; value: string }[] = [];
  for (let i = cleanB.length - 1; i >= 0; i--) {
    const shift = cleanB.length - 1 - i;
    if (cleanB[i] === '1') {
      partialProducts.push({ shift, value: cleanA + '0'.repeat(shift) });
    } else {
      partialProducts.push({ shift, value: '0'.repeat(cleanA.length + shift) });
    }
  }

  return {
    productBinary: prodDec.toString(2),
    productDecimal: prodDec,
    partialProducts,
  };
}

export interface BinaryDivisionResult {
  quotientBinary: string;
  quotientDecimal: number;
  remainderBinary: string;
  remainderDecimal: number;
  isDivideByZero: boolean;
}

export function divideBinary(binA: string, binB: string): BinaryDivisionResult {
  const decA = parseInt(binA.replace(/[^01]/g, '') || '0', 2);
  const decB = parseInt(binB.replace(/[^01]/g, '') || '0', 2);

  if (decB === 0) {
    return {
      quotientBinary: '0',
      quotientDecimal: 0,
      remainderBinary: '0',
      remainderDecimal: 0,
      isDivideByZero: true,
    };
  }

  const quot = Math.floor(decA / decB);
  const rem = decA % decB;

  return {
    quotientBinary: quot.toString(2),
    quotientDecimal: quot,
    remainderBinary: rem.toString(2),
    remainderDecimal: rem,
    isDivideByZero: false,
  };
}
